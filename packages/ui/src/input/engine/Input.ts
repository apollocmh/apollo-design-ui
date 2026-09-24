/**
 * rc-input 的 `Input` 行为等价物（engine 自建）。
 *
 * 判据（rc `Input.js`，registry 备注：IME 不可简化）：
 *  1. 组合态闸门 `compositionRef`：compositionstart 置 true、compositionend 置 false
 *     并触发一次 change（`source: 'compositionEnd'`）；若裁剪前后值相同则**跳过**
 *     （issue 46587 去重）。裁剪只在**非组合态**执行。
 *  2. Enter：`!keyLock && !e.isComposing` ⇒ onPressEnter 并上锁（keyup 解锁），
 *     防止 IME 回车与业务回车重复触发。
 *  3. `resolveOnChange` 克隆事件写入裁剪后的值（见 common-utils 注释）。
 *  4. 清空：setValue('') + focus + resolveOnChange（click 事件 ⇒ value=''）。
 *  5. 计数 suffix：`span.{p}-show-count-suffix`（有 suffix 时额外 `-has-suffix`）。
 */

import { useControlledValue } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, ref, shallowRef, type VNodeChild } from 'vue';
import { BaseInput, type ClearConfig } from './BaseInput';
import { resolveOnChange } from './common-utils';
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
    classNames: {
      type: Object as PropType<Record<string, string | undefined>>,
      default: undefined,
    },
    styles: {
      type: Object as PropType<Record<string, Record<string, string | number> | undefined>>,
      default: undefined,
    },
    /** 输入内容变化（事件对象的 target.value 是裁剪后的值）。 */
    onChange: { type: Function as PropType<(e: unknown) => void>, default: undefined },
    onPressEnter: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
    onFocus: { type: Function as PropType<(e: FocusEvent) => void>, default: undefined },
    onBlur: { type: Function as PropType<(e: FocusEvent) => void>, default: undefined },
    onKeyDown: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
    onKeyUp: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
    onCompositionStart: {
      type: Function as PropType<(e: CompositionEvent) => void>,
      default: undefined,
    },
    onCompositionEnd: {
      type: Function as PropType<(e: CompositionEvent) => void>,
      default: undefined,
    },
    onClear: { type: Function as PropType<() => void>, default: undefined },
    /** 焦点交回输入框（wrapper 点击时用）。 */
    onTriggerFocus: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { attrs, expose }) {
    const inputRef = shallowRef<HTMLInputElement | null>(null);
    const holderEl = shallowRef<HTMLElement | null>(null);

    const composition = ref(false);
    let keyLock = false;
    const focused = ref(false);

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
      () => inputRef.value,
    );

    function triggerChange(
      e: Event,
      currentValue: string,
      source: 'change' | 'compositionEnd',
    ): void {
      const cutValue = getExceedValue(currentValue, composition.value);
      if (source === 'compositionEnd' && currentValue === cutValue) {
        // 组合结束与 change 重复 ⇒ 跳过（issue 46587）
        return;
      }
      setInnerValue(cutValue);
      if (inputRef.value) {
        resolveOnChange(inputRef.value, e as never, props.onChange, cutValue);
      }
    }

    const onInternalChange = (e: Event): void => {
      triggerChange(e, (e.target as HTMLInputElement).value, 'change');
    };
    const onInternalCompositionEnd = (e: CompositionEvent): void => {
      composition.value = false;
      triggerChange(e, (e.currentTarget as HTMLInputElement).value, 'compositionEnd');
      props.onCompositionEnd?.(e);
    };
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (
        props.onPressEnter &&
        e.key === 'Enter' &&
        !keyLock &&
        !(e as never as { isComposing?: boolean }).isComposing
      ) {
        keyLock = true;
        props.onPressEnter(e);
      }
      props.onKeyDown?.(e);
    };
    const handleKeyUp = (e: KeyboardEvent): void => {
      if (e.key === 'Enter') {
        keyLock = false;
      }
      props.onKeyUp?.(e);
    };
    const handleFocus = (e: FocusEvent): void => {
      focused.value = true;
      props.onFocus?.(e);
    };
    const handleBlur = (e: FocusEvent): void => {
      if (keyLock) {
        keyLock = false;
      }
      focused.value = false;
      props.onBlur?.(e);
    };
    const handleReset = (e: MouseEvent): void => {
      setInnerValue('');
      inputRef.value?.focus();
      if (inputRef.value) {
        resolveOnChange(inputRef.value, e as never, props.onChange);
      }
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
      if (!props.suffix && !countConfig.value.show) {
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
                    [`${props.prefixCls}-show-count-has-suffix`]: !!props.suffix,
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
      const inputElement = h('input', {
        ...attrs,
        ref: inputRef,
        autoComplete: props.autoComplete,
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
        onChange: onInternalChange,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onKeydown: handleKeyDown,
        onKeyup: handleKeyUp,
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
          prefix: props.prefix,
          suffix: suffixNode.value,
          addonBefore: props.addonBefore,
          addonAfter: props.addonAfter,
          className: [props.className, outOfRangeCls],
          style: props.style,
          disabled: props.disabled,
          readOnly: props.readOnly,
          focused: focused.value,
          value: formatValue.value,
          allowClear: props.allowClear,
          showCount: props.showCount,
          hidden: props.hidden,
          classNames: props.classNames,
          styles: props.styles,
          onReset: handleReset,
          onClear: props.onClear,
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
