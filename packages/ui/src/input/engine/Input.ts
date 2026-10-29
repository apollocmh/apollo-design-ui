import {
  computed,
  defineComponent,
  h,
  mergeProps,
  type PropType,
  ref,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { useInputValue } from '../hooks/use-input-value';
import { BaseInput, type ClearConfig } from './BaseInput';
import { hasContent, nativeInputAttrs } from './common-utils';
import { type InputCountProp, useCount, useCountDisplay, useCountExceed } from './use-count';

export const RcInput = defineComponent({
  name: 'AInputRc',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: 'apollo-input' },
    value: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: { type: String as PropType<string | undefined>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    readOnly: { type: Boolean, default: undefined },
    focused: { type: Boolean, default: undefined },
    hidden: { type: Boolean, default: undefined },
    autoComplete: { type: String, default: undefined },
    autoFocus: { type: Boolean, default: undefined },
    htmlSize: { type: Number, default: undefined },
    maxLength: { type: Number, default: undefined },
    type: { type: String, default: 'text' },
    prefix: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    suffix: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    addonBefore: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    addonAfter: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    allowClear: { type: [Boolean, Object] as PropType<boolean | ClearConfig>, default: undefined },
    showCount: { type: [Boolean, Object] as PropType<unknown>, default: undefined },
    count: { type: Object as PropType<InputCountProp>, default: undefined },
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
    /** 输入内容变化（事件对象的 target.value 是裁剪后的值）。 */
    onValueChange: { type: Function as PropType<(value: string) => void>, default: undefined },
    onChange: { type: Function as PropType<(e: Event) => void>, default: undefined },
    onPressEnter: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
    onClear: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
    /** 焦点交回输入框（wrapper 点击时用）。 */
    onTriggerFocus: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { attrs, expose }) {
    const inputRef = shallowRef<HTMLInputElement | null>(null);
    const holderEl = shallowRef<HTMLElement | null>(null);

    let keyLock = false;
    const focused = ref(false);
    const valueState = useInputValue(props, inputRef, (value, composing) =>
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
      () => inputRef.value,
    );

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Enter' && !keyLock && !event.isComposing && !valueState.composing.value) {
        keyLock = true;
        props.onPressEnter?.(event);
      }
    };
    const handleKeyUp = (event: KeyboardEvent): void => {
      if (event.key === 'Enter') keyLock = false;
    };
    const handleFocus = (): void => {
      focused.value = true;
    };
    const handleBlur = (): void => {
      focused.value = false;
      keyLock = false;
    };

    const focus = (option?: {
      preventScroll?: boolean;
      cursor?: 'start' | 'end' | 'all';
    }): void => {
      inputRef.value?.focus(option ? { preventScroll: option.preventScroll } : undefined);
      if (option?.cursor && inputRef.value) {
        const len = inputRef.value.value.length;
        const at = option.cursor === 'start' ? 0 : option.cursor === 'end' ? len : 0;
        const to = option.cursor === 'start' ? 0 : option.cursor === 'end' ? len : len;
        inputRef.value.setSelectionRange(at, to);
      }
    };

    expose({
      focus,
      blur: () => {
        inputRef.value?.blur();
      },
      setSelectionRange: (
        start: number,
        end: number,
        direction?: 'forward' | 'backward' | 'none',
      ) => {
        inputRef.value?.setSelectionRange(start, end, direction);
      },
      select: () => {
        inputRef.value?.select();
      },
      get input() {
        return inputRef.value;
      },
      get nativeElement() {
        return holderEl.value ?? inputRef.value;
      },
    });

    // 计数节点（rc 把 count 放进 suffix）
    const suffixNode = computed<VNodeChild>(() => {
      if (!hasContent(props.suffix) && !countConfig.value.show) {
        return undefined;
      }
      return [
        countConfig.value.show
          ? h(
              'span',
              {
                class: [
                  `${props.prefixCls}-show-count-suffix`,
                  {
                    [`${props.prefixCls}-show-count-has-suffix`]: hasContent(props.suffix),
                  },
                  props.classNames?.count,
                ],
                style: props.styles?.count,
              },
              [display.value.dataCount as never],
            )
          : null,
        props.suffix,
      ];
    });

    return () => {
      const outOfRangeCls = display.value.isOutOfRange
        ? `${props.prefixCls}-out-of-range`
        : undefined;
      const inputElement = h(
        'input',
        mergeProps(
          {
            ref: inputRef,
            autoComplete: props.autoComplete,
            autofocus: props.autoFocus,
            class: [
              props.prefixCls,
              { [`${props.prefixCls}-disabled`]: props.disabled },
              props.classNames?.input,
            ],
            style: props.styles?.input,
            size: props.htmlSize,
            type: props.type,
            maxLength: props.maxLength,
            disabled: props.disabled,
            readOnly: props.readOnly,
            value: formatValue.value,
            onInput: valueState.onInput,
            onFocus: handleFocus,
            onBlur: handleBlur,
            onKeydown: handleKeyDown,
            onKeyup: handleKeyUp,
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
          prefix: props.prefix,
          suffix: suffixNode.value,
          addonBefore: props.addonBefore,
          addonAfter: props.addonAfter,
          className: [props.className, outOfRangeCls],
          style: props.style,
          themeStyle: props.themeStyle,
          disabled: props.disabled,
          readOnly: props.readOnly,
          focused: focused.value,
          value: formatValue.value,
          allowClear: props.allowClear,
          showCount: props.showCount,
          hidden: props.hidden,
          classNames: props.classNames,
          styles: props.styles,
          onReset: valueState.clear,
          onTriggerFocus: () => {
            props.onTriggerFocus?.();
            focus();
          },
          onExposeElement: (el: HTMLElement | null) => {
            holderEl.value = el;
          },
        } as never,
        { default: () => [inputElement] },
      );
    };
  },
});
