/**
 * Input.OTP —— antd 6.6.4 `components/input/OTP/index.tsx` 的 Vue 实现。
 *
 * 判据（es/input/OTP/index.js + OTPInput.js，逐条对齐）：
 *  1. 根 `div role="group"`；每格一个 Input，外层 `span.{prefix}-input-wrapper`
 *     （`role="presentation"`）；`mask` 时额外渲染 `-mask-icon`（默认 •）。
 *  2. `patchValue(index, txt)`：先补齐前面的空格，再单字符替换或整段粘贴；
 *     截断到 length、去掉尾部空格、最后过一个 `formatter`。
 *  3. `onInput(value[])` 每次变化都发；`onChange(string)` **只在全部填满且值变化**时发。
 *  4. 方向键左右移动焦点；Backspace 在空格子上退到前一格；Ctrl/Cmd+Z 阻止撤销；
 *     聚焦时空格前的第一个空格子会抢焦点；焦点/鼠标按下/抬起后 `select()` 单元格。
 *  5. 语义槽 root / input / separator；Form 状态经代理 context 下发给每格
 *     （`hasFeedback: false`，避免每格都长反馈图标）。
 */

import { raf, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  type PropType,
  provide,
  ref,
  shallowRef,
  type VNodeChild,
  watch,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { type SizeType, useSize } from '../config-provider/size-context';
import { formItemInputContextKey, getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { useCompactItemContext } from '../space';
import { InputComponent } from './Input';
import type {
  InputRef,
  OTPProps,
  OTPRef,
  OTPSemanticClassNames,
  OTPSemanticStyles,
} from './interface';

const DEFAULT_MASK_VALUE = '•';

const strToArr = (str: string): string[] => (str || '').split('');

export const OTPComponent = defineComponent({
  name: 'AInputOTP',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    length: { type: Number, default: 6 },
    variant: { type: String as PropType<OTPProps['variant']>, default: undefined },
    size: { type: String as PropType<SizeType>, default: undefined },
    defaultValue: { type: String, default: undefined },
    value: { type: String as PropType<string | undefined>, default: undefined },
    onChange: { type: Function as PropType<(value: string) => void>, default: undefined },
    formatter: { type: Function as PropType<(value: string) => string>, default: undefined },
    separator: {
      type: [String, Number, Object, Function, Array] as PropType<OTPProps['separator']>,
      default: undefined,
    },
    disabled: { type: Boolean, default: undefined },
    status: { type: String as PropType<OTPProps['status']>, default: undefined },
    mask: { type: [Boolean, String] as PropType<boolean | string>, default: undefined },
    type: { type: String, default: undefined },
    autoComplete: { type: String, default: undefined },
    autoFocus: { type: Boolean, default: undefined },
    inputMode: { type: String, default: undefined },
    onInput: { type: Function as PropType<(value: string[]) => void>, default: undefined },
    onFocus: { type: Function as PropType<(e: FocusEvent) => void>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<OTPProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<OTPProps['styles']>, default: undefined },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit, expose }) {
    const warning = useDevWarning('Input.OTP');
    if (typeof props.mask === 'string' && props.mask.length > 1) {
      warning(false, '`mask` prop should be a single character.');
    }

    const context = useComponentConfig('otp');
    const { getPrefixCls } = context;
    const direction = useDirection();
    const prefixCls = computed(() => getPrefixCls('otp', props.prefixCls));
    const { compactSize } = useCompactItemContext(
      () => prefixCls.value,
      () => direction.value,
    );
    const mergedSize = useSize((ctx) => props.size ?? compactSize.value ?? ctx);
    const { variant } = useVariant({
      component: 'otp',
      variant: () => props.variant,
    });

    const formContext = useFormItemInputContext();
    const mergedStatus = computed(() => getMergedStatus(formContext.value.status, props.status));
    provide(
      formItemInputContextKey,
      computed(() => ({
        ...formContext.value,
        status: mergedStatus.value,
        hasFeedback: false,
        feedbackIcon: null,
      })),
    );

    const length = computed(() => props.length ?? 6);
    const format = (txt: string): string => (props.formatter ? props.formatter(txt) : txt);

    const valueCells = ref<string[]>(strToArr(format(props.defaultValue || '')));
    watch(
      () => props.value,
      (next) => {
        if (next !== undefined) valueCells.value = strToArr(next);
      },
      { immediate: true },
    );

    const mergedProps = computed<OTPProps>(
      () =>
        ({
          ...props,
          length: length.value,
          size: mergedSize.value,
          variant: variant.value,
        }) as OTPProps,
    );

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      OTPProps,
      OTPSemanticClassNames,
      OTPSemanticStyles
    >(
      [
        () => (context as { classNames?: OTPSemanticClassNames }).classNames,
        () => props.classNames,
      ],
      [
        () => (context as { styles?: OTPSemanticStyles }).styles,
        () => semanticRootStyle((context as { style?: Record<string, string | number> }).style),
        () => props.styles,
        () => semanticRootStyle(attrs.style as Record<string, string | number>),
      ],
      () => mergedProps.value,
    );

    const containerRef = shallowRef<HTMLDivElement | null>(null);
    const inputRefs: Record<number, InputRef | null> = {};

    function patchValue(index: number, txt: string): string[] {
      let nextCells = [...valueCells.value];
      for (let i = 0; i < index; i += 1) {
        if (!nextCells[i]) nextCells[i] = '';
      }
      if (txt.length <= 1) {
        nextCells[index] = txt;
      } else {
        nextCells = nextCells.slice(0, index).concat(strToArr(txt));
      }
      nextCells = nextCells.slice(0, length.value);
      for (let i = nextCells.length - 1; i >= 0; i -= 1) {
        if (nextCells[i]) break;
        nextCells.pop();
      }
      const formatted = strToArr(format(nextCells.map((c) => c || ' ').join('')));
      return formatted.map((c, i) => (c === ' ' && !nextCells[i] ? (nextCells[i] ?? '') : c));
    }

    function triggerValueCellsChange(nextCells: string[]): void {
      const previous = valueCells.value;
      valueCells.value = nextCells;
      props.onInput?.(nextCells);
      if (
        nextCells.length === length.value &&
        nextCells.every((c) => !!c) &&
        nextCells.some((c, index) => previous[index] !== c)
      ) {
        const joined = nextCells.join('');
        emit('update:value', joined);
        props.onChange?.(joined);
      }
    }

    function syncSelection(index: number): void {
      raf(() => {
        const input = inputRefs[index]?.input;
        if (input && document.activeElement === input) input.select();
      });
    }

    function focusCell(index: number): void {
      if (index < 0 || index >= length.value) return;
      inputRefs[index]?.focus();
    }

    function onInputChange(index: number, txt: string): void {
      const nextCells = patchValue(index, txt);
      const nextIndex = Math.min(index + txt.length, length.value - 1);
      if (nextIndex !== index && nextCells[index] !== undefined) {
        focusCell(nextIndex);
      }
      triggerValueCellsChange(nextCells);
    }

    function onInputFocus(event: FocusEvent, index: number): void {
      for (let i = 0; i < index; i += 1) {
        if (!inputRefs[i]?.input?.value) {
          focusCell(i);
          break;
        }
      }
      props.onFocus?.(event);
      syncSelection(index);
    }

    function onInternalKeyDown(index: number, value: string, event: KeyboardEvent): void {
      const { key, ctrlKey, metaKey } = event;
      if (key === 'ArrowLeft') focusCell(index - 1);
      else if (key === 'ArrowRight') focusCell(index + 1);
      else if (key === 'z' && (ctrlKey || metaKey)) event.preventDefault();
      else if (key === 'Backspace' && !value) focusCell(index - 1);
      syncSelection(index);
    }

    const maskValue = computed(() =>
      typeof props.mask === 'string' ? props.mask : DEFAULT_MASK_VALUE,
    );
    const cellType = computed(() => props.type ?? (props.mask ? 'password' : 'text'));

    function renderCell(index: number): VNodeChild {
      const singleValue = valueCells.value[index] || '';
      const cell = h(InputComponent, {
        ref: (el: unknown) => {
          inputRefs[index] = el as InputRef | null;
        },
        value: singleValue,
        size: mergedSize.value,
        disabled: props.disabled,
        status: mergedStatus.value,
        variant: variant.value,
        type: cellType.value,
        autoComplete: props.autoComplete,
        inputMode: props.inputMode,
        autoFocus: index === 0 && props.autoFocus,
        htmlSize: 1,
        class: [
          mergedClassNames.value.input,
          `${prefixCls.value}-input`,
          { [`${prefixCls.value}-mask-input`]: !!props.mask },
        ],
        styles: { input: mergedStyles.value.input },
        'aria-label': `OTP Input ${index + 1}`,
        onInput: (e: Event) => onInputChange(index, (e.target as HTMLInputElement).value),
        onFocus: (e: FocusEvent) => onInputFocus(e, index),
        onKeyDown: (e: KeyboardEvent) => onInternalKeyDown(index, singleValue, e),
        onMousedown: () => syncSelection(index),
        onMouseup: () => syncSelection(index),
      } as never);

      const children: VNodeChild[] = [];
      if (props.mask && singleValue !== '') {
        children.push(
          h(
            'span',
            { class: `${prefixCls.value}-mask-icon`, 'aria-hidden': 'true' },
            maskValue.value,
          ),
        );
      }
      children.push(cell);

      return h(
        'span',
        { class: `${prefixCls.value}-input-wrapper`, role: 'presentation' },
        children,
      );
    }

    function renderSeparator(index: number): VNodeChild {
      const node = typeof props.separator === 'function' ? props.separator(index) : props.separator;
      if (!node) return null;
      return h(
        'span',
        {
          class: [`${prefixCls.value}-separator`, mergedClassNames.value.separator],
          style: mergedStyles.value.separator,
        },
        node as never,
      );
    }

    expose({
      focus: () => focusCell(0),
      blur: () => {
        for (let i = 0; i < length.value; i += 1) inputRefs[i]?.blur();
      },
      get nativeElement() {
        return containerRef.value;
      },
    } satisfies OTPRef);

    return () => {
      const children: VNodeChild[] = [];
      for (let index = 0; index < length.value; index += 1) {
        children.push(renderCell(index));
        if (index < length.value - 1) children.push(renderSeparator(index));
      }

      const { class: _attrsClass, style: _attrsStyle, ...domAttrs } = attrs;
      void _attrsClass;
      void _attrsStyle;

      return h(
        'div',
        {
          ...domAttrs,
          ref: containerRef,
          class: [
            attrs.class,
            prefixCls.value,
            {
              [`${prefixCls.value}-sm`]: mergedSize.value === 'small',
              [`${prefixCls.value}-lg`]: mergedSize.value === 'large',
              [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
            },
            (context as { className?: string }).className,
            mergedClassNames.value.root,
          ],
          style: mergedStyles.value.root,
          role: 'group',
        },
        children,
      );
    };
  },
});
