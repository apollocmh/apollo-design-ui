import { useDevWarning } from '@apollo-design/utils';
import {
  type Component,
  type CSSProperties,
  computed,
  defineComponent,
  h,
  isVNode,
  mergeProps,
  type PropType,
  type SlotsType,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { useAllowClear } from '../_internal/use-allow-clear';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import {
  type ComponentStyleConfig,
  useComponentConfig,
  useDirection,
} from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { type SizeType, useSize } from '../config-provider/size-context';
import { getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { useCompactItemContext } from '../space/Compact';
import { getStatusClassNames } from '../space/statusUtils';
import { RcInput } from './engine/Input';
import { useRemovePasswordTimeout } from './hooks/use-remove-password-timeout';
import { inputEmits } from './input-emits';
import type {
  InputProps,
  InputRef,
  InputSemanticClassNames,
  InputSemanticStyles,
  InputSlots,
} from './interface';
import { useInputTheme } from './use-input-theme';

/** D42：组件对象 → VNode（Button 同款归一化）。 */
function asNode(value: VNodeChild | Component | null | undefined): VNodeChild | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (isVNode(value) || Array.isArray(value)) return value as VNodeChild;
  return h(value as Component);
}

export const inputProps = {
  prefixCls: { type: String, default: undefined },
  classNames: {
    type: [Object, Function] as PropType<InputProps['classNames']>,
    default: undefined,
  },
  styles: { type: [Object, Function] as PropType<InputProps['styles']>, default: undefined },
  value: { type: String as PropType<string | undefined>, default: undefined },
  defaultValue: { type: String as PropType<string | undefined>, default: undefined },
  size: { type: String as PropType<SizeType>, default: undefined },
  disabled: { type: Boolean, default: undefined },
  readOnly: { type: Boolean, default: undefined },
  bordered: { type: Boolean, default: undefined },
  variant: { type: String as PropType<InputProps['variant']>, default: undefined },
  status: { type: String as PropType<InputProps['status']>, default: undefined },
  prefix: { type: null as unknown as PropType<VNodeChild | Component>, default: undefined },
  suffix: { type: null as unknown as PropType<VNodeChild | Component>, default: undefined },
  addonBefore: { type: null as unknown as PropType<VNodeChild | Component>, default: undefined },
  addonAfter: { type: null as unknown as PropType<VNodeChild | Component>, default: undefined },
  allowClear: {
    type: [Boolean, Object] as PropType<InputProps['allowClear']>,
    default: undefined,
  },
  clearIcon: { type: null as unknown as PropType<VNodeChild | Component>, default: undefined },
  showCount: { type: [Boolean, Object] as PropType<InputProps['showCount']>, default: undefined },
  count: { type: Object as PropType<InputProps['count']>, default: undefined },
  maxLength: { type: Number, default: undefined },
  htmlSize: { type: Number, default: undefined },
  autoComplete: { type: String, default: undefined },
  placeholder: { type: String, default: undefined },
  type: { type: String, default: undefined },
  hidden: { type: Boolean, default: undefined },
  autoFocus: { type: Boolean, default: undefined },
};
export const InputComponent = defineComponent({
  name: 'AInput',
  inheritAttrs: false,
  slots: Object as SlotsType<InputSlots>,
  props: inputProps,
  emits: inputEmits,
  setup(props, { attrs, emit, expose, slots }) {
    const devWarning = useDevWarning('Input');
    const context = useComponentConfig<ComponentStyleConfig & Record<string, unknown>>('input');
    const { getPrefixCls } = context;
    const direction = useDirection();
    const contextDisabled = useDisabled();
    const formItemContext = useFormItemInputContext();

    // ============================ Warning ==============================
    // devWarning 语义：valid=false 才打印 ⇒ 提供了 deprecated prop 要取反
    devWarning.deprecated(props.bordered === undefined, 'bordered', 'variant');
    devWarning.deprecated(props.addonBefore === undefined, 'addonBefore', 'Space.Compact');
    devWarning.deprecated(props.addonAfter === undefined, 'addonAfter', 'Space.Compact');

    // ============================= Prefix ==============================
    const prefixCls = computed(() => getPrefixCls('input', props.prefixCls));
    const themeStyle = useInputTheme(() => prefixCls.value);

    // ============================= Compact =============================
    const { compactSize, compactItemClassnames } = useCompactItemContext(
      prefixCls,
      () => direction.value,
    );

    // ============================= Size ================================
    const mergedSize = useSize((ctx) => props.size ?? compactSize.value ?? ctx);

    // ============================= Disabled ============================
    const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);

    // ============================= Status ==============================
    const hasFeedback = computed(() => formItemContext.value.hasFeedback === true);
    const mergedStatus = computed(() =>
      getMergedStatus(formItemContext.value.status, props.status),
    );

    // ============================= Variant =============================
    const { variant, enableVariantCls } = useVariant({
      component: 'input',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });

    // ============================= Semantic ============================
    const mergedProps = computed<InputProps>(() => ({
      ...attrs,
      ...props,
      size: mergedSize.value,
      disabled: mergedDisabled.value,
      status: mergedStatus.value,
      variant: variant.value,
    }));
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      InputProps,
      InputSemanticClassNames,
      InputSemanticStyles
    >(
      [() => context.classNames as InputSemanticClassNames | undefined, () => props.classNames],
      [
        () => context.styles as InputSemanticStyles | undefined,
        () => semanticRootStyle(context.style),
        () => props.styles,
        // 根 style 是 Vue 原生 attrs，但仍经语义 root 通道下发（与上游落点一致）
        () => semanticRootStyle(attrs.style as CSSProperties),
      ],
      // ⚠️ 传 getter 而不是 `mergedProps.value`：后者是 setup 期求值出的对象，
      //    函数式 classNames/styles 会永远按首帧的 props 计算（Issue #3.2）。
      () => mergedProps.value,
    );

    // ============================= AllowClear ==========================
    // ⚠️ 全部传 getter（Issue #3.1）：裸值会让 `allowClear` / `clearIcon` 的动态变化失效。
    //    `context.allowClear` 走的是 `useComponentConfig` 的惰性视图 ⇒ 在 computed
    //    内读它会被追踪，ConfigProvider 的运行时更新也能传导。
    const mergedAllowClear = useAllowClear({
      allowClear: () => props.allowClear,
      clearIcon: () => asNode(props.clearIcon),
      contextAllowClear: () => (context as { allowClear?: InputProps['allowClear'] }).allowClear,
      contextClearIcon: () => (context as { clearIcon?: VNodeChild }).clearIcon,
      componentName: 'Input',
    });

    // ============================= Ref =================================
    const innerRef = shallowRef<InputRef | null>(null);
    const removePasswordTimeout = useRemovePasswordTimeout(() => innerRef.value, true);

    const handleChange = (event: Event): void => {
      removePasswordTimeout();
      emit('change', event);
    };

    expose({
      focus: (option?: { preventScroll?: boolean; cursor?: 'start' | 'end' | 'all' }) => {
        innerRef.value?.focus(option);
      },
      blur: () => {
        innerRef.value?.blur();
      },
      setSelectionRange: (
        start: number,
        end: number,
        direction?: 'forward' | 'backward' | 'none',
      ) => {
        innerRef.value?.setSelectionRange(start, end, direction);
      },
      select: () => {
        innerRef.value?.select();
      },
      get input() {
        return innerRef.value?.input ?? null;
      },
      get nativeElement() {
        return innerRef.value?.nativeElement ?? null;
      },
    } satisfies InputRef);

    return () => {
      const p = prefixCls.value;
      const rootClass = [
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        attrs.class,
        compactItemClassnames.value,
        (context as { className?: string }).className,
        mergedClassNames.value.root,
      ];

      const prefix = slots.prefix ? slots.prefix() : asNode(props.prefix);
      const suffix = slots.suffix ? slots.suffix() : asNode(props.suffix);
      return h(
        RcInput,
        mergeProps(attrs, {
          ref: innerRef as never,
          prefixCls: p,
          autoComplete: props.autoComplete ?? (context as { autoComplete?: string }).autoComplete,
          value: props.value,
          defaultValue: props.defaultValue,
          disabled: mergedDisabled.value,
          readOnly: props.readOnly,
          type: props.type ?? 'text',
          htmlSize: props.htmlSize,
          maxLength: props.maxLength,
          hidden: props.hidden,
          autoFocus: props.autoFocus,
          placeholder: props.placeholder,
          prefix,
          suffix: hasFeedback.value
            ? [suffix, asNode(formItemContext.value.feedbackIcon as never)]
            : suffix,
          addonBefore: asNode(props.addonBefore),
          addonAfter: asNode(props.addonAfter),
          allowClear: mergedAllowClear.value,
          showCount: props.showCount,
          count: props.count,
          className: rootClass,
          style: mergedStyles.value.root,
          themeStyle: themeStyle.value,
          styles: mergedStyles.value as never,
          classNames: {
            ...mergedClassNames.value,
            input: [
              {
                [`${p}-sm`]: mergedSize.value === 'small',
                [`${p}-lg`]: mergedSize.value === 'large',
                [`${p}-rtl`]: direction.value === 'rtl',
              },
              mergedClassNames.value.input,
            ],
            variant: [
              { [`${p}-${variant.value}`]: enableVariantCls.value },
              getStatusClassNames(p, mergedStatus.value),
            ],
            affixWrapper: [
              {
                [`${p}-affix-wrapper-sm`]: mergedSize.value === 'small',
                [`${p}-affix-wrapper-lg`]: mergedSize.value === 'large',
                [`${p}-affix-wrapper-rtl`]: direction.value === 'rtl',
              },
              mergedClassNames.value.affixWrapper,
            ],
            wrapper: [
              { [`${p}-group-rtl`]: direction.value === 'rtl' },
              mergedClassNames.value.wrapper,
            ],
            groupWrapper: [
              {
                [`${p}-group-wrapper-${variant.value}`]: enableVariantCls.value,
                [`${p}-group-wrapper-rtl`]: direction.value === 'rtl',
                [`${p}-group-wrapper-sm`]: mergedSize.value === 'small',
                [`${p}-group-wrapper-lg`]: mergedSize.value === 'large',
              },
              mergedClassNames.value.groupWrapper,
            ],
          },
          onValueChange: (value: string) => emit('update:value', value),
          onChange: handleChange,
          onClear: (event: MouseEvent) => emit('clear', event),
          onPressEnter: (event: KeyboardEvent) => emit('pressEnter', event),
          onFocus: removePasswordTimeout,
          onBlur: removePasswordTimeout,
        }),
      );
    };
  },
});
