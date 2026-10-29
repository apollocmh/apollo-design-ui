import { useResizeObserver } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  shallowRef,
  type VNodeChild,
  watch,
} from 'vue';
import { useInputValue } from '../hooks/use-input-value';
import { BaseInput, type ClearConfig } from './BaseInput';
import {
  calculateAutoSizeStyle,
  getTextAreaSizingSignature,
  resolveAutoSize,
} from './calculate-node-height';
import { nativeInputAttrs } from './common-utils';
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
    themeStyle: { type: Object as PropType<Record<string, string>>, default: undefined },
    classNames: {
      type: Object as PropType<Record<string, string | undefined>>,
      default: undefined,
    },
    styles: {
      type: Object as PropType<Record<string, Record<string, string | number> | undefined>>,
      default: undefined,
    },
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
    onChange: { type: Function as PropType<(e: Event) => void>, default: undefined },
    onPressEnter: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
    onClear: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
    onResize: {
      type: Function as PropType<(size: { width: number; height: number }) => void>,
      default: undefined,
    },
  },
  setup(props, { attrs, expose }) {
    const textareaRef = shallowRef<HTMLTextAreaElement | null>(null);
    const holderEl = shallowRef<HTMLElement | null>(null);

    const focused = ref(false);
    const autoSizeStyle = ref<Record<string, string | number> | null>(null);
    const valueState = useInputValue(props, textareaRef, (value, composing) =>
      getExceedValue(value, composing),
    );
    const { formatValue } = valueState;

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

    let disposed = false;
    let pendingMeasure = false;
    let measuredWidth: number | undefined;
    let measuredSignature: string | undefined;
    let lastResize: { width: number; height: number } | undefined;
    onBeforeUnmount(() => {
      disposed = true;
    });

    function syncAutoSize(): void {
      const el = textareaRef.value;
      if (!el || !sizeInfo.value.enabled) {
        autoSizeStyle.value = null;
        measuredSignature = undefined;
        return;
      }
      const signature = JSON.stringify([
        getTextAreaSizingSignature(el),
        sizeInfo.value.minRows,
        sizeInfo.value.maxRows,
      ]);
      if (signature === measuredSignature) return;
      measuredSignature = signature;
      const next = calculateAutoSizeStyle(el, sizeInfo.value.minRows, sizeInfo.value.maxRows);
      autoSizeStyle.value = {
        height: `${next.height}px`,
        ...(next.overflowY ? { overflowY: next.overflowY } : {}),
        ...(next.minHeight !== undefined ? { minHeight: `${next.minHeight}px` } : {}),
        ...(next.maxHeight !== undefined ? { maxHeight: `${next.maxHeight}px` } : {}),
        resize: next.resize,
      };
      const current = { width: el.offsetWidth, height: next.height };
      if (
        !lastResize ||
        lastResize.width !== current.width ||
        lastResize.height !== current.height
      ) {
        lastResize = current;
        props.onResize?.(current);
      }
    }

    function queueMeasure(): void {
      if (disposed || pendingMeasure) return;
      pendingMeasure = true;
      nextTick(() => {
        pendingMeasure = false;
        if (!disposed) syncAutoSize();
      });
    }
    onMounted(queueMeasure);
    watch(
      [textareaRef, () => sizeInfo.value.enabled],
      ([el, enabled], _previous, onCleanup) => {
        measuredSignature = undefined;
        if (!el || !enabled) return;
        let ancestors: Element[] = [];
        const NativeObserver = el.ownerDocument.defaultView?.MutationObserver;
        const bindAncestors = () => {
          const next: Element[] = [];
          for (let node: Element | null = el; node; node = node.parentElement) next.push(node);
          if (
            next.length === ancestors.length &&
            next.every((node, index) => node === ancestors[index])
          )
            return;
          if (ancestors.length) observer?.disconnect();
          ancestors = next;
          for (const node of ancestors)
            observer?.observe(node, { attributes: true, childList: true });
        };
        const observer = NativeObserver
          ? new NativeObserver(() => {
              if (disposed) return;
              // Teleport or native moves can change which ancestor supplies a style.
              bindAncestors();
              queueMeasure();
            })
          : undefined;
        bindAncestors();
        // Mutation delivery observes a transition's start; measure its final typography too.
        const settledEvents = [
          'transitionend',
          'transitioncancel',
          'animationend',
          'animationcancel',
        ] as const;
        const onStyleSettled = (event: Event) => {
          if (ancestors.some((node) => node === event.target)) queueMeasure();
        };
        const doc = el.ownerDocument;
        for (const name of settledEvents) doc.addEventListener(name, onStyleSettled, true);
        onCleanup(() => {
          observer?.disconnect();
          for (const name of settledEvents) doc.removeEventListener(name, onStyleSettled, true);
        });
        queueMeasure();
      },
      { flush: 'post' },
    );
    watch(
      [
        formatValue,
        () => props.autoSize,
        () => props.className,
        () => props.classNames,
        () => props.styles,
        () => props.style,
        () => props.themeStyle,
      ],
      queueMeasure,
      { deep: true, flush: 'post' },
    );
    useResizeObserver({
      target: textareaRef,
      disabled: () => !sizeInfo.value.enabled && !props.onResize,
      onResize: ({ width }) => {
        const el = textareaRef.value;
        if (!sizeInfo.value.enabled && el) {
          const current = { width: el.offsetWidth, height: el.offsetHeight };
          if (
            !lastResize ||
            lastResize.width !== current.width ||
            lastResize.height !== current.height
          ) {
            lastResize = current;
            props.onResize?.(current);
          }
        }
        if (width !== measuredWidth) {
          measuredWidth = width;
          queueMeasure();
        }
      },
    });

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        event.key === 'Enter' &&
        !event.repeat &&
        !event.isComposing &&
        !valueState.composing.value
      ) {
        props.onPressEnter?.(event);
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
      const textareaElement = h(
        'textarea',
        mergeProps(
          {
            ref: textareaRef,
            autoComplete: props.autoComplete,
            rows: props.rows,
            maxLength: props.maxLength,
            // rc ResizableTextArea：textarea 恒带 `${prefixCls}` 基类 + 禁用类
            // （variant/status 在裸态由 BaseInput 的 variant 键追加，affix 态落 wrapper）
            // 🚨 `${prefixCls}-disabled` 是 `ResizableTextArea.js` 的产物，此前漏了
            //    （`input.dom.json` 里没有 disabled 的 textarea 用例 ⇒ 一直没被发现；
            //     由 mentions 的 disabled 形态首次踩到，见 PITFALLS）。
            class: [
              props.prefixCls,
              { [`${props.prefixCls}-disabled`]: props.disabled },
              props.classNames?.textarea,
            ],
            style: {
              resize: (props.style as { resize?: string } | undefined)?.resize,
              ...(props.styles?.textarea ?? {}),
              ...(autoSizeStyle.value ?? {}),
            },
            disabled: props.disabled,
            readOnly: props.readOnly,
            value: formatValue.value,
            onInput: valueState.onInput,
            onFocus: () => {
              focused.value = true;
            },
            onBlur: () => {
              focused.value = false;
            },
            onKeydown: handleKeyDown,
            onCompositionstart: valueState.onCompositionstart,
            onCompositionend: valueState.onCompositionend,
          },
          nativeInputAttrs(attrs),
        ),
      );

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
          themeStyle: props.themeStyle,
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
          onReset: valueState.clear,
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
