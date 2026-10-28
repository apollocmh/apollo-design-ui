/** Native Vue editor; keyboard behaviour originally referenced antd6.6.4 Editable. */
import { EnterOutlined } from '@apollo-design/icons';
import { isVNode, KeyCode, useResizeObserver } from '@apollo-design/utils';
import {
  type CSSProperties,
  cloneVNode,
  defineComponent,
  h,
  nextTick,
  onMounted,
  type PropType,
  ref,
  shallowRef,
  type VNodeChild,
  watch,
} from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import type { DirectionType } from '../config-provider/context';
import { calculateAutoSizeStyle, resolveAutoSize } from '../input/engine/calculate-node-height';
import type {
  AutoSizeType,
  TypographyClassValue,
  TypographySemanticClassNames,
  TypographySemanticStyles,
} from './interface';

export const Editable = defineComponent({
  name: 'ATypographyEditable',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    value: { type: String, default: '' },
    ariaLabel: { type: String, default: undefined },
    onSave: { type: Function as PropType<(value: string) => void>, required: true },
    onCancel: { type: Function as PropType<() => void>, required: true },
    onEnd: { type: Function as PropType<() => void>, default: undefined },
    className: {
      type: [String, Array, Object] as PropType<TypographyClassValue>,
      default: undefined,
    },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    tokenStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    direction: { type: String as PropType<DirectionType>, default: undefined },
    maxLength: { type: Number, default: undefined },
    autoSize: { type: [Boolean, Object] as PropType<boolean | AutoSizeType>, default: true },
    enterIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    component: { type: String, default: undefined },
    classNames: { type: Object as PropType<TypographySemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<TypographySemanticStyles>, default: undefined },
  },
  setup(props, { attrs, expose }) {
    const rootRef = ref<HTMLElement | null>(null),
      textareaRef = ref<HTMLTextAreaElement | null>(null);
    const current = ref(props.value),
      autoStyle = shallowRef<CSSProperties>({});
    let composing = false,
      lastKey: string | undefined,
      finishing = false;
    expose({ nativeElement: rootRef });
    watch(
      () => props.value,
      (value) => {
        current.value = value;
      },
    );
    const resize = () => {
      const element = textareaRef.value,
        size = resolveAutoSize(props.autoSize);
      if (!element || !size.enabled) {
        autoStyle.value = {};
        return;
      }
      const measured = calculateAutoSizeStyle(element, size.minRows, size.maxRows);
      const style: CSSProperties = {
        height: `${measured.height}px`,
        resize: 'none',
        overflowY: measured.overflowY,
        minHeight: measured.minHeight === undefined ? undefined : `${measured.minHeight}px`,
        maxHeight: measured.maxHeight === undefined ? undefined : `${measured.maxHeight}px`,
      };
      if (JSON.stringify(style) !== JSON.stringify(autoStyle.value)) autoStyle.value = style;
    };
    watch(
      [
        current,
        () => props.autoSize,
        () => props.styles,
        () => props.style,
        () => props.tokenStyle,
      ],
      resize,
      { flush: 'post', deep: true },
    );
    let width = -1;
    useResizeObserver({
      target: () => textareaRef.value,
      onResize: (size) => {
        if (size.offsetWidth !== width) {
          width = size.offsetWidth;
          resize();
        }
      },
    });
    onMounted(() => {
      resize();
      const element = textareaRef.value;
      if (!element) return;
      element.focus();
      element.setSelectionRange(element.value.length, element.value.length);
    });
    const finish = (cancel: boolean, keyboard = false) => {
      if (finishing) return;
      finishing = true;
      if (cancel) props.onCancel();
      else {
        props.onSave(current.value.trim());
        if (keyboard) props.onEnd?.();
      }
      void nextTick(() => {
        if (rootRef.value?.isConnected) finishing = false;
      });
    };
    const modified = (e: KeyboardEvent) => e.ctrlKey || e.altKey || e.metaKey || e.shiftKey;
    const key = (e: KeyboardEvent) => e.key || String(e.keyCode);
    const enter = (e: KeyboardEvent) => e.key === 'Enter' || e.keyCode === KeyCode.ENTER;
    return () => {
      const {
        'aria-label': _label,
        'aria-labelledby': labelledBy,
        'aria-describedby': describedBy,
        ...rootAttrs
      } = attrs;
      const icon =
        props.enterIcon === null
          ? null
          : props.enterIcon === undefined
            ? h(EnterOutlined, { 'aria-hidden': true })
            : props.enterIcon;
      const confirm = isVNode(icon)
        ? cloneVNode(icon, { class: `${props.prefixCls}-edit-content-confirm` })
        : icon;
      return h(
        'div',
        {
          ...rootAttrs,
          ref: rootRef,
          class: [
            props.prefixCls,
            `${props.prefixCls}-edit-content`,
            {
              [`${props.prefixCls}-rtl`]: props.direction === 'rtl',
              [`${props.prefixCls}-${props.component}`]: !!props.component,
            },
            props.className,
            props.classNames?.root,
          ],
          ...styleAttrs({ ...props.tokenStyle, ...props.styles?.root, ...props.style }),
        },
        [
          h('textarea', {
            ref: textareaRef,
            rows: 1,
            maxlength: props.maxLength,
            value: current.value,
            'aria-label': props.ariaLabel,
            'aria-labelledby': labelledBy,
            'aria-describedby': describedBy,
            class: props.classNames?.textarea,
            style: { ...props.styles?.textarea, ...autoStyle.value },
            onInput: () => {
              if (textareaRef.value) current.value = textareaRef.value.value;
            },
            onCompositionstart: () => {
              composing = true;
              lastKey = undefined;
            },
            onCompositionend: () => {
              composing = false;
              lastKey = undefined;
            },
            onKeydown: (e: KeyboardEvent) => {
              if (composing || e.isComposing || e.keyCode === 229) return;
              lastKey = key(e);
              if (enter(e) && !modified(e)) e.preventDefault();
            },
            onKeyup: (e: KeyboardEvent) => {
              if (lastKey !== key(e) || composing || e.isComposing || modified(e)) return;
              lastKey = undefined;
              if (enter(e)) finish(false, true);
              else if (e.key === 'Escape' || e.keyCode === KeyCode.ESC) finish(true);
            },
            onBlur: () => finish(false),
          }),
          confirm,
        ],
      );
    };
  },
});
