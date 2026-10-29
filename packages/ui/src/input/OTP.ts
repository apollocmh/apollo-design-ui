import { useControlledValue, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  nextTick,
  type PropType,
  provide,
  type SlotsType,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { type SizeType, useSize } from '../config-provider/size-context';
import { formItemInputContextKey, getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { useCompactItemContext } from '../space';
import { hasContent } from './engine/common-utils';
import { InputComponent } from './Input';
import type {
  InputRef,
  OTPProps,
  OTPRef,
  OTPSemanticClassNames,
  OTPSemanticStyles,
  OTPSlots,
} from './interface';

const DEFAULT_MASK_VALUE = '•';

const strToArr = (str: string): string[] => Array.from(str || '');

export const OTPComponent = defineComponent({
  name: 'AInputOTP',
  inheritAttrs: false,
  slots: Object as SlotsType<OTPSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    length: { type: Number, default: 6 },
    variant: { type: String as PropType<OTPProps['variant']>, default: undefined },
    size: { type: String as PropType<SizeType>, default: undefined },
    defaultValue: { type: String, default: undefined },
    value: { type: String as PropType<string | undefined>, default: undefined },
    formatter: { type: Function as PropType<(value: string) => string>, default: undefined },
    separator: {
      type: [String, Number, Object, Boolean, Array] as PropType<OTPProps['separator']>,
      default: undefined,
    },
    disabled: { type: Boolean, default: undefined },
    status: { type: String as PropType<OTPProps['status']>, default: undefined },
    mask: { type: [Boolean, String] as PropType<boolean | string>, default: undefined },
    type: { type: String, default: undefined },
    autoComplete: { type: String, default: undefined },
    autoFocus: { type: Boolean, default: undefined },
    inputMode: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<OTPProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<OTPProps['styles']>, default: undefined },
  },
  emits: {
    'update:value': (_value: string) => true,
    input: (_cells: string[]) => true,
    change: (_value: string) => true,
    focus: (_event: FocusEvent) => true,
  },
  setup(props, { attrs, emit, expose, slots }) {
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
    const disabled = useDisabled();
    const mergedDisabled = computed(() => props.disabled ?? disabled.value);
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

    const length = computed(() =>
      Number.isFinite(props.length) ? Math.max(1, Math.floor(props.length)) : 6,
    );
    const format = (txt: string): string => (props.formatter ? props.formatter(txt) : txt);
    const [value, setValue] = useControlledValue<string | undefined>({
      defaultValue: () => format(props.defaultValue ?? ''),
      getValue: () => props.value,
    });
    const valueCells = computed(() =>
      strToArr(value.value ?? '')
        .slice(0, length.value)
        .map((char) => (char === ' ' ? '' : char)),
    );

    const mergedProps = computed<OTPProps>(() => ({
      ...attrs,
      ...props,
      length: length.value,
      size: mergedSize.value,
      variant: variant.value,
      status: mergedStatus.value,
      disabled: mergedDisabled.value,
    }));

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
      for (let i = nextCells.length - 1; i >= 0; i -= 1) {
        if (nextCells[i]) break;
        nextCells.pop();
      }
      const formatted = strToArr(format(nextCells.map((c) => c || ' ').join('')));
      return formatted
        .slice(0, length.value)
        .map((c, i) => (c === ' ' && !nextCells[i] ? (nextCells[i] ?? '') : c));
    }

    function triggerValueCellsChange(nextCells: string[]): void {
      const previous = valueCells.value;
      const joined = nextCells.map((char) => char || ' ').join('');
      setValue(joined);
      emit('update:value', joined);
      emit('input', [...nextCells]);
      if (
        nextCells.length === length.value &&
        nextCells.every(Boolean) &&
        nextCells.some((char, index) => previous[index] !== char)
      )
        emit('change', joined);
    }

    function syncSelection(index: number): void {
      void nextTick(() => {
        const input = inputRefs[index]?.input;
        if (input && input.ownerDocument.activeElement === input) input.select();
      });
    }

    function focusCell(index: number): void {
      if (index < 0 || index >= length.value) return;
      inputRefs[index]?.focus();
    }

    function onInputChange(index: number, txt: string): void {
      const nextCells = patchValue(index, txt);
      const nextIndex = Math.min(index + strToArr(format(txt)).length, length.value - 1);
      triggerValueCellsChange(nextCells);
      if (nextIndex !== index && nextCells[index] !== undefined)
        void nextTick(() => focusCell(nextIndex));
    }

    function onInputFocus(event: FocusEvent, index: number): void {
      for (let i = 0; i < index; i += 1) {
        if (!inputRefs[i]?.input?.value) {
          focusCell(i);
          break;
        }
      }
      emit('focus', event);
      syncSelection(index);
    }

    function onInternalKeyDown(index: number, value: string, event: KeyboardEvent): void {
      const { key, ctrlKey, metaKey } = event;
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        event.preventDefault();
        const step = (key === 'ArrowRight' ? 1 : -1) * (direction.value === 'rtl' ? -1 : 1);
        focusCell(index + step);
      } else if (key === 'z' && (ctrlKey || metaKey)) event.preventDefault();
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
        disabled: mergedDisabled.value,
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
        onChange: (event: Event) => {
          const target = event.target;
          if (target instanceof HTMLInputElement) onInputChange(index, target.value);
        },
        onFocus: (e: FocusEvent) => onInputFocus(e, index),
        onKeydown: (e: KeyboardEvent) => onInternalKeyDown(index, singleValue, e),
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
      const node = slots.separator ? slots.separator({ index }) : props.separator;
      if (!hasContent(node)) return null;
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
          style: [
            mergedStyles.value.root,
            attrs.hidden !== undefined && attrs.hidden !== false && attrs.hidden !== null
              ? { display: 'none' }
              : undefined,
          ],
          role: 'group',
        },
        children,
      );
    };
  },
});
