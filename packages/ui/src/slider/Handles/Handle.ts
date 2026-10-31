/** A native, focusable slider handle. Scoped replacements receive this same binding contract. */
import {
  computed,
  defineComponent,
  h,
  inject,
  type PropType,
  type SlotsType,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { sliderContextKey } from '../context';
import type { SliderHandleInfo, SliderHandleNodeProps } from '../interface';
import { getDirectionStyle, getIndex } from '../util';

export type HandleSlotNodeInfo = Pick<SliderHandleInfo, 'nodeProps' | 'className' | 'style'>;
export interface HandleRef {
  focus: () => void;
  nativeElement: HTMLElement | null;
}
const legacyKeys: Record<number, string> = {
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  33: 'PageUp',
  34: 'PageDown',
  36: 'Home',
  35: 'End',
  8: 'Backspace',
  46: 'Delete',
};
const movingKeys = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);
const keyName = (event: KeyboardEvent) => event.key || legacyKeys[event.which || event.keyCode];

export default defineComponent({
  name: 'ASliderHandle',
  inheritAttrs: false,
  expose: ['focus', 'nativeElement'],
  props: {
    prefixCls: { type: String, required: true },
    value: { type: Number, required: true },
    valueIndex: { type: Number as PropType<number | null>, default: null },
    activeIndex: { type: Number, default: -1 },
    style: { type: Object as PropType<import('vue').CSSProperties>, default: undefined },
    dragging: { type: Boolean, default: false },
    draggingDelete: { type: Boolean, default: false },
  },
  emits: {
    startMove: (_event: MouseEvent | TouchEvent, _index: number) => true,
    offsetChange: (_offset: number | 'min' | 'max', _index: number) => true,
    changeComplete: () => true,
    delete: (_index: number) => true,
    focus: (_event: FocusEvent, _index: number) => true,
    blur: (_event: FocusEvent, _index: number) => true,
    mouseenter: (_event: MouseEvent, _index: number) => true,
    mouseleave: (_event: MouseEvent, _index: number) => true,
  },
  slots: Object as SlotsType<{
    default?: (info: SliderHandleInfo) => VNodeChild;
    wrapper?: (info: SliderHandleInfo & { node: VNodeChild }) => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const context = inject(sliderContextKey);
    if (!context) throw new Error('SliderHandle requires Slider context');
    const nativeElement = shallowRef<HTMLElement | null>(null);
    const disabled = computed(
      () => props.valueIndex !== null && context.isHandleDisabled(props.valueIndex),
    );
    const focus = (): void => {
      if (!disabled.value) nativeElement.value?.focus();
    };
    const onStartMove = (event: MouseEvent | TouchEvent) => {
      const index = props.valueIndex;
      if (index === null || event.defaultPrevented) return;
      if (disabled.value) {
        event.stopPropagation();
        return;
      }
      if (!('targetTouches' in event) && event.button !== 0) return;
      focus();
      emit('startMove', event, index);
    };
    const onKeydown = (event: KeyboardEvent) => {
      const index = props.valueIndex;
      if (index === null) return;
      context.onKeydown(event, index);
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.keyCode === 229 ||
        disabled.value ||
        !context.keyboard
      )
        return;
      const key = keyName(event);
      const dir = context.direction;
      let offset: number | 'min' | 'max' | undefined;
      if (key === 'ArrowLeft') offset = dir === 'ltr' || dir === 'btt' ? -1 : 1;
      if (key === 'ArrowRight') offset = dir === 'ltr' || dir === 'btt' ? 1 : -1;
      if (key === 'ArrowUp') offset = dir !== 'ttb' ? 1 : -1;
      if (key === 'ArrowDown') offset = dir !== 'ttb' ? -1 : 1;
      if (key === 'Home') offset = 'min';
      if (key === 'End') offset = 'max';
      if (key === 'PageUp') offset = 2;
      if (key === 'PageDown') offset = -2;
      if (key === 'Backspace' || key === 'Delete') {
        event.preventDefault();
        emit('delete', index);
      }
      if (offset !== undefined) {
        event.preventDefault();
        emit('offsetChange', offset, index);
      }
    };
    const onKeyup = (event: KeyboardEvent) => {
      const index = props.valueIndex;
      if (index === null) return;
      context.onKeyup(event, index);
      if (
        !event.defaultPrevented &&
        !event.isComposing &&
        event.keyCode !== 229 &&
        !disabled.value &&
        context.keyboard &&
        movingKeys.has(keyName(event) ?? '')
      )
        emit('changeComplete');
    };
    const renderHandle = () => {
      const index = props.valueIndex;
      const nodeProps: SliderHandleNodeProps = {
        ...(index !== null ? context.handleAttrs : {}),
        ref: (element) => {
          nativeElement.value = element instanceof HTMLElement ? element : null;
        },
      };
      if (index !== null) {
        nodeProps.tabindex = disabled.value ? undefined : getIndex(context.tabIndex, index);
        nodeProps.role = 'slider';
        nodeProps['aria-valuemin'] = context.min;
        nodeProps['aria-valuemax'] = context.max;
        nodeProps['aria-valuenow'] = props.value;
        nodeProps['aria-disabled'] = disabled.value;
        const label = getIndex(context.ariaLabelForHandle, index);
        const labelledby = getIndex(context.ariaLabelledByForHandle, index);
        if (label !== undefined) nodeProps['aria-label'] = label;
        if (labelledby !== undefined) nodeProps['aria-labelledby'] = labelledby;
        if (context.ariaRequired !== undefined) nodeProps['aria-required'] = context.ariaRequired;
        const formatter = getIndex(context.ariaValueTextFormatterForHandle, index);
        if (formatter) nodeProps['aria-valuetext'] = formatter(props.value);
        nodeProps['aria-orientation'] =
          context.direction === 'ltr' || context.direction === 'rtl' ? 'horizontal' : 'vertical';
        nodeProps.onMousedown = onStartMove;
        nodeProps.onTouchstart = onStartMove;
        nodeProps.onFocus = (event) => emit('focus', event, index);
        nodeProps.onBlur = (event) => emit('blur', event, index);
        nodeProps.onMouseenter = (event) => emit('mouseenter', event, index);
        nodeProps.onMouseleave = (event) => emit('mouseleave', event, index);
        nodeProps.onKeydown = onKeydown;
        nodeProps.onKeyup = onKeyup;
      } else {
        nodeProps['aria-hidden'] = true;
      }
      const className = [
        `${props.prefixCls}-handle`,
        index !== null && context.range ? `${props.prefixCls}-handle-${index + 1}` : '',
        props.dragging ? `${props.prefixCls}-handle-dragging` : '',
        props.draggingDelete ? `${props.prefixCls}-handle-dragging-delete` : '',
        disabled.value ? `${props.prefixCls}-handle-disabled` : '',
        context.classNames.handle,
      ]
        .filter(Boolean)
        .join(' ');
      const style = {
        ...getDirectionStyle(context.direction, props.value, context.min, context.max),
        ...props.style,
        ...context.styles.handle,
      };
      const info: SliderHandleInfo = {
        index: index ?? props.activeIndex,
        value: props.value,
        prefixCls: props.prefixCls,
        dragging: props.dragging,
        draggingDelete: props.draggingDelete,
        nodeProps,
        className,
        style,
      };
      const node = slots.default
        ? slots.default(info)
        : h('div', { ...nodeProps, class: className, style });
      return slots.wrapper ? slots.wrapper({ ...info, node }) : node;
    };
    return { nativeElement, focus, renderHandle };
  },
  render() {
    return this.renderHandle();
  },
});
