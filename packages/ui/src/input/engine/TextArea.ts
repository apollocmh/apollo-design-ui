/**
 * rc-input 的 `TextArea` 行为等价物（engine 自建）。
 *
 * 与 Input 的同源部分：受控值、组合态裁剪、计数、清空（resolveOnChange）。
 * TextArea 独有的两条：
 *  1. **autoSize**：mount / 值变化时用隐藏影子节点量测并写内联
 *     `height` / `overflowY` / `resize`（见 calculate-node-height 的算法注释）。
 *  2. `-out-of-range`、`data-count`（字符串形态时挂在 affixWrapper 上）。
 */

import { useControlledValue } from '@apollo-design/utils';
import {
  computed,
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
import { BaseInput, type ClearConfig } from './BaseInput';
import { calculateAutoSizeStyle, resolveAutoSize } from './calculate-node-height';
import { resolveOnChange } from './common-utils';
import { type InputCountProp, useCount, useCountDisplay, useCountExceed } from './use-count';

export const RcTextArea = defineComponent({
  name: 'ATextAreaRc',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: 'apollo-input' },
    value: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: { type: String as PropType<string | undefined>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    readOnly: { type: Boolean, default: undefined },
    hidden: { type: Boolean, default: undefined },
    autoComplete: { type: String, default: undefined },
    maxLength: { type: Number, default: undefined },
    rows: { type: Number, default: undefined },
    suffix: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    allowClear: { type: [Boolean, Object] as PropType<boolean | ClearConfig>, default: undefined },
    showCount: { type: [Boolean, Object] as PropType<unknown>, default: undefined },
    count: { type: Object as PropType<InputCountProp>, default: undefined },
    autoSize: {
      type: [Boolean, Object] as PropType<boolean | { minRows?: number; maxRows?: number }>,
      default: undefined,
    },
    className: { type: [String, Array, Object] as PropType<unknown>, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    classNames: {
      type: Object as PropType<Record<string, string | undefined>>,
      default: undefined,
    },
    styles: {
      type: Object as PropType<Record<string, Record<string, string | number> | undefined>>,
      default: undefined,
    },
    onChange: { type: Function as PropType<(e: unknown) => void>, default: undefined },
    onPressEnter: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
    onFocus: { type: Function as PropType<(e: FocusEvent) => void>, default: undefined },
    onBlur: { type: Function as PropType<(e: FocusEvent) => void>, default: undefined },
    onKeyDown: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
    onCompositionStart: {
      type: Function as PropType<(e: CompositionEvent) => void>,
      default: undefined,
    },
    onCompositionEnd: {
      type: Function as PropType<(e: CompositionEvent) => void>,
      default: undefined,
    },
    onClear: { type: Function as PropType<() => void>, default: undefined },
    onResize: {
      type: Function as PropType<(size: { width: number; height: number }) => void>,
      default: undefined,
    },
  },
  setup(props, { attrs, expose }) {
    const textareaRef = shallowRef<HTMLTextAreaElement | null>(null);
    const holderEl = shallowRef<HTMLElement | null>(null);

    const composition = ref(false);
    const focused = ref(false);
    const autoSizeStyle = ref<Record<string, string | number> | null>(null);

    const [innerValue, setInnerValue] = useControlledValue<string | undefined>({
      defaultValue: () => props.defaultValue,
      getValue: () => props.value,
      onChange: undefined,
    });
    const formatValue = computed<string>(() =>
      innerValue.value === undefined || innerValue.value === null ? '' : String(innerValue.value),
    );

    const countConfig = computed(() => useCount(props.count, props.showCount as never));
    const display = computed(() =>
      useCountDisplay({
        countConfig: countConfig.value,
        value: formatValue.value,
        maxLength: props.maxLength,
      }),
    );
    const getExceedValue = useCountExceed(
      () => countConfig.value,
      () => textareaRef.value,
    );

    const sizeInfo = computed(() => resolveAutoSize(props.autoSize));

    function syncAutoSize(): void {
      const el = textareaRef.value;
      if (!el || !sizeInfo.value.enabled) {
        autoSizeStyle.value = null;
        return;
      }
      const next = calculateAutoSizeStyle(el, sizeInfo.value.minRows, sizeInfo.value.maxRows);
      autoSizeStyle.value = {
        height: `${next.height}px`,
        ...(next.overflowY ? { overflowY: next.overflowY } : {}),
        ...(next.minHeight !== undefined ? { minHeight: `${next.minHeight}px` } : {}),
        ...(next.maxHeight !== undefined ? { maxHeight: `${next.maxHeight}px` } : {}),
        resize: next.resize,
      };
      props.onResize?.({ width: el.offsetWidth, height: next.height });
    }

    onMounted(() => {
      nextTick(syncAutoSize);
    });
    watch([formatValue, () => props.autoSize], () => {
      nextTick(syncAutoSize);
    });

    function triggerChange(
      e: Event,
      currentValue: string,
      source: 'change' | 'compositionEnd',
    ): void {
      const cutValue = getExceedValue(currentValue, composition.value);
      if (source === 'compositionEnd' && currentValue === cutValue) {
        return;
      }
      setInnerValue(cutValue);
      const target = textareaRef.value;
      if (target) {
        resolveOnChange(target, e as never, props.onChange, cutValue);
      }
    }

    const onInternalChange = (e: Event): void => {
      triggerChange(e, (e.target as HTMLTextAreaElement).value, 'change');
    };
    const onInternalCompositionEnd = (e: CompositionEvent): void => {
      composition.value = false;
      triggerChange(e, (e.currentTarget as HTMLTextAreaElement).value, 'compositionEnd');
      props.onCompositionEnd?.(e);
    };
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (
        e.key === 'Enter' &&
        props.onPressEnter &&
        !(e as never as { isComposing?: boolean }).isComposing
      ) {
        props.onPressEnter(e);
      }
      props.onKeyDown?.(e);
    };
    const handleReset = (e: MouseEvent): void => {
      setInnerValue('');
      textareaRef.value?.focus();
      const el = textareaRef.value;
      if (el) {
        resolveOnChange(el, e as never, props.onChange);
      }
    };

    expose({
      focus: (option?: { preventScroll?: boolean }) => {
        textareaRef.value?.focus(option);
      },
      blur: () => {
        textareaRef.value?.blur();
      },
      resizableTextArea: {
        get textArea() {
          return textareaRef.value;
        },
      },
      get nativeElement() {
        return holderEl.value ?? textareaRef.value;
      },
    });

    const suffixNode = computed<VNodeChild>(() => {
      if (!countConfig.value.show) {
        return props.suffix;
      }
      return [
        props.suffix,
        h(
          'span',
          {
            class: [`${props.prefixCls}-data-count`, props.classNames?.count],
            style: props.styles?.count,
          },
          [display.value.dataCount as never],
        ),
      ];
    });

    return () => {
      const textareaElement = h('textarea', {
        ...attrs,
        ref: textareaRef,
        autoComplete: props.autoComplete,
        rows: props.rows,
        // rc ResizableTextArea：textarea 恒带 `${prefixCls}` 基类（variant/status
        // 在裸态由 BaseInput 的 variant 键追加，affix 态落 wrapper）
        class: [props.prefixCls, props.classNames?.textarea],
        style: {
          resize: (props.style as { resize?: string } | undefined)?.resize,
          ...(props.styles?.textarea ?? {}),
          ...(autoSizeStyle.value ?? {}),
        },
        disabled: props.disabled,
        readOnly: props.readOnly,
        value: formatValue.value,
        onChange: onInternalChange,
        onFocus: (e: FocusEvent) => {
          focused.value = true;
          props.onFocus?.(e);
        },
        onBlur: (e: FocusEvent) => {
          focused.value = false;
          props.onBlur?.(e);
        },
        onKeydown: handleKeyDown,
        onCompositionstart: (e: CompositionEvent) => {
          composition.value = true;
          props.onCompositionStart?.(e);
        },
        onCompositionend: onInternalCompositionEnd,
      });

      return h(
        BaseInput,
        {
          prefixCls: props.prefixCls,
          suffix: suffixNode.value,
          className: [
            props.className,
            display.value.isOutOfRange ? `${props.prefixCls}-out-of-range` : undefined,
          ],
          style: props.style,
          disabled: props.disabled,
          readOnly: props.readOnly,
          focused: focused.value,
          value: formatValue.value,
          allowClear: props.allowClear,
          showCount: props.showCount,
          hidden: props.hidden,
          classNames: {
            ...(props.classNames ?? {}),
            affixWrapper: [
              props.classNames?.affixWrapper,
              {
                [`${props.prefixCls}-show-count`]: props.showCount,
                // rc TextArea：allowClear 时 wrapper 加 -textarea-allow-clear
                [`${props.prefixCls}-textarea-allow-clear`]: props.allowClear,
              },
            ],
          },
          styles: props.styles,
          dataAttrs:
            typeof display.value.dataCount === 'string'
              ? { affixWrapper: { 'data-count': display.value.dataCount } }
              : undefined,
          onReset: handleReset,
          onClear: props.onClear,
          onTriggerFocus: () => {
            textareaRef.value?.focus();
          },
          onExposeElement: (el: HTMLElement | null) => {
            holderEl.value = el;
          },
        } as never,
        { default: () => [textareaElement] },
      );
    };
  },
});
