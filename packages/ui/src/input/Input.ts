/**
 * Input —— antd 6.6.4 `components/input/Input.tsx` 的 Vue 实现。
 *
 * 判据（es/input/Input.js 181 行，逐条对齐）：
 *  1. **类名链**：root = clsx(className, rootClassName, compactItem, contextClassName,
 *     语义 root)；`classNames.input` 承载 -sm/-lg/-rtl；`classNames.variant` 承载
 *     `-{variant}` + 状态类（裸 input 时挂在 input 上）；affixWrapper /
 *     wrapper / groupWrapper 各有自己的尺寸与 rtl 派生。
 *  2. **deprecated ×3**：bordered / addonBefore / addonAfter（判据 `!== undefined`）。
 *  3. **allowClear** 经 `useAllowClear`（默认图标 CloseCircleFilled）。
 *  4. **密码自动填充规避**：focus/blur/change 都先 `removePasswordTimeout()`。
 *  5. **suffix**：`hasFeedback || suffix` ⇒ suffix = [suffix, feedbackIcon]。
 *  6. 语义合并顺序 `[contextClassNames, classNames]` /
 *     `[contextStyles, contextStyleRoot, styles, styleRoot]`（style 覆盖 styles.root）。
 */

import { useDevWarning } from '@apollo-design/utils';
import {
  type Component,
  type CSSProperties,
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { useAllowClear } from '../_internal/use-allow-clear';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { type SizeType, useSize } from '../config-provider/size-context';
import { getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { useCompactItemContext } from '../space/Compact';
import { getStatusClassNames } from '../space/statusUtils';
import { RcInput } from './engine/Input';
import { useRemovePasswordTimeout } from './hooks/use-remove-password-timeout';
import type {
  InputProps,
  InputRef,
  InputSemanticClassNames,
  InputSemanticStyles,
} from './interface';

/** D42：组件对象 → VNode（Button 同款归一化）。 */
function asNode(value: VNodeChild | Component | null | undefined): VNodeChild | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (isVNode(value) || Array.isArray(value)) return value as VNodeChild;
  return h(value as Component);
}

export const InputComponent = defineComponent({
  name: 'AInput',
  inheritAttrs: false,
  props: {
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
    type: { type: String, default: undefined },
    hidden: { type: Boolean, default: undefined },
    autoFocus: { type: Boolean, default: undefined },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit, expose, slots }) {
    const devWarning = useDevWarning('Input');
    const context = useComponentConfig('input');
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
    const mergedProps = computed<InputProps>(
      () =>
        ({
          ...props,
          size: mergedSize.value,
          disabled: mergedDisabled.value,
        }) as InputProps,
    );
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      InputProps,
      InputSemanticClassNames,
      InputSemanticStyles
    >(
      [() => context.classNames as InputSemanticClassNames | undefined, () => props.classNames],
      [
        () => context.styles as InputSemanticStyles | undefined,
        () => semanticRootStyle(undefined),
        () => props.styles,
        // 根 style 是 Vue 原生 attrs，但仍经语义 root 通道下发（与上游落点一致）
        () => semanticRootStyle(attrs.style as CSSProperties),
      ],
      mergedProps.value,
    );

    // ============================= AllowClear ==========================
    const mergedAllowClear = useAllowClear({
      allowClear: props.allowClear,
      clearIcon: asNode(props.clearIcon),
      contextAllowClear: (context as { allowClear?: InputProps['allowClear'] }).allowClear,
      contextClearIcon: asNode((context as { clearIcon?: VNodeChild }).clearIcon as never),
      componentName: 'Input',
    });

    // ============================= Ref =================================
    const innerRef = shallowRef<InputRef | null>(null);
    const removePasswordTimeout = useRemovePasswordTimeout(() => innerRef.value, true);

    const handleChange = (e: unknown): void => {
      removePasswordTimeout();
      const value = (e as { target?: { value?: string } })?.target?.value;
      emit('update:value', value);
      (attrs as { onChange?: (e: unknown) => void }).onChange?.(e);
    };

    // prefix/suffix：slot 优先、prop 兜底（antd 两者皆可传；slot 便于传 VNode/组件）
    const prefixNode = computed<VNodeChild | undefined>(() => {
      const fromSlot = slots.prefix?.();
      if (
        fromSlot !== undefined &&
        fromSlot !== null &&
        (!Array.isArray(fromSlot) || fromSlot.length)
      ) {
        return fromSlot as VNodeChild;
      }
      return asNode(props.prefix);
    });

    const suffixNode = computed<VNodeChild | undefined>(() => {
      const fromSlot = slots.suffix?.();
      const suffix =
        fromSlot !== undefined && fromSlot !== null && (!Array.isArray(fromSlot) || fromSlot.length)
          ? (fromSlot as VNodeChild)
          : asNode(props.suffix);
      if (!hasFeedback.value && suffix === undefined) {
        return undefined;
      }
      return [
        suffix,
        hasFeedback.value ? asNode(formItemContext.value.feedbackIcon as never) : null,
      ];
    });

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

      return h(RcInput, {
        ...attrs,
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
        prefix: prefixNode.value,
        suffix: suffixNode.value,
        addonBefore: asNode(props.addonBefore),
        addonAfter: asNode(props.addonAfter),
        allowClear: mergedAllowClear.value,
        showCount: props.showCount,
        count: props.count,
        className: rootClass,
        style: mergedStyles.value.root,
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
        onChange: handleChange,
        onFocus: (e: FocusEvent) => {
          removePasswordTimeout();
          (attrs as { onFocus?: (e: FocusEvent) => void }).onFocus?.(e);
        },
        onBlur: (e: FocusEvent) => {
          removePasswordTimeout();
          (attrs as { onBlur?: (e: FocusEvent) => void }).onBlur?.(e);
        },
      } as never);
    };
  },
});
