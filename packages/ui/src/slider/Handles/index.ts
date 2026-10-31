/** Native handles retain their component references while the active decorative anchor follows focus/hover. */
import {
  defineComponent,
  h,
  type PropType,
  ref,
  type ShallowRef,
  type SlotsType,
  shallowRef,
  type VNodeChild,
  watch,
} from 'vue';
import type { SliderHandleInfo } from '../interface';
import Handle, { type HandleRef } from './Handle';

export interface HandlesRef {
  focus: (index: number) => void;
  hideHelp: () => void;
}
type WrapperScope = SliderHandleInfo & { node: VNodeChild };
export default defineComponent({
  name: 'ASliderHandles',
  inheritAttrs: false,
  expose: ['focus', 'hideHelp'],
  props: {
    prefixCls: { type: String, required: true },
    style: {
      type: [Object, Array] as PropType<
        import('vue').CSSProperties | import('vue').CSSProperties[]
      >,
      default: undefined,
    },
    values: { type: Array as PropType<number[]>, required: true },
    draggingIndex: { type: Number, default: -1 },
    dragging: { type: Boolean, default: false },
    draggingDelete: { type: Boolean, default: false },
    hasActiveHandle: { type: Boolean, default: false },
  },
  emits: {
    startMove: (_event: MouseEvent | TouchEvent, _index: number) => true,
    offsetChange: (_offset: number | 'min' | 'max', _index: number) => true,
    changeComplete: () => true,
    delete: (_index: number) => true,
    focus: (_event: FocusEvent, _index: number) => true,
    blur: (_event: FocusEvent, _index: number) => true,
    mouseenter: () => true,
    mouseleave: () => true,
  },
  slots: Object as SlotsType<{
    handle?: (info: SliderHandleInfo) => VNodeChild;
    activeHandle?: (info: SliderHandleInfo) => VNodeChild;
    wrapper?: (info: WrapperScope) => VNodeChild;
    activeWrapper?: (info: WrapperScope) => VNodeChild;
  }>,
  setup(props, { emit, slots }) {
    const handleRefs = new Map<number, ShallowRef<HandleRef | null>>();
    const reference = (index: number) => {
      let current = handleRefs.get(index);
      if (!current) {
        current = shallowRef<HandleRef | null>(null);
        handleRefs.set(index, current);
      }
      return current;
    };
    const activeIndex = ref(-1);
    const activeVisible = ref(false);
    const focus = (index: number): void => {
      handleRefs.get(index)?.value?.focus();
    };
    const hideHelp = (): void => {
      activeVisible.value = false;
    };
    watch(
      () => props.values.length,
      (length) => {
        for (const index of handleRefs.keys()) if (index >= length) handleRefs.delete(index);
        if (activeIndex.value >= length) {
          activeIndex.value = -1;
          hideHelp();
        }
      },
    );
    const renderHandles = () => {
      const nodes = props.values.map((value, index) =>
        h(
          Handle,
          {
            key: index,
            ref: reference(index),
            prefixCls: props.prefixCls,
            value,
            valueIndex: index,
            style: Array.isArray(props.style) ? props.style[index] : props.style,
            dragging: props.draggingIndex === index,
            draggingDelete: props.draggingIndex === index && props.draggingDelete,
            onStartMove: (event, handleIndex) => emit('startMove', event, handleIndex),
            onOffsetChange: (offset, handleIndex) => emit('offsetChange', offset, handleIndex),
            onChangeComplete: () => emit('changeComplete'),
            onDelete: (handleIndex) => emit('delete', handleIndex),
            onFocus: (event, handleIndex) => {
              activeIndex.value = handleIndex;
              activeVisible.value = true;
              emit('focus', event, handleIndex);
            },
            onBlur: (event, handleIndex) => emit('blur', event, handleIndex),
            onMouseenter: (_event, handleIndex) => {
              activeIndex.value = handleIndex;
              activeVisible.value = true;
              emit('mouseenter');
            },
            onMouseleave: () => emit('mouseleave'),
          },
          { default: slots.handle, wrapper: slots.wrapper },
        ),
      );
      const value = props.values[activeIndex.value];
      if (props.hasActiveHandle && activeVisible.value && value !== undefined)
        nodes.push(
          h(
            Handle,
            {
              key: 'active',
              prefixCls: props.prefixCls,
              value,
              valueIndex: null,
              activeIndex: activeIndex.value,
              dragging: props.dragging,
              draggingDelete: props.draggingDelete,
              style: { pointerEvents: 'none' },
            },
            { default: slots.activeHandle, wrapper: slots.activeWrapper },
          ),
        );
      return nodes;
    };
    return { focus, hideHelp, renderHandles };
  },
  render() {
    return this.renderHandles();
  },
});
