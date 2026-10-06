/**
 * Mentions —— antd 6.6.4 `components/mentions/index.tsx`（219 行）的 Vue 实现。
 *
 * 上游是**薄壳**：真正的引擎在 `@rc-component/mentions`（见 `./engine/`）。
 * 本层只负责：
 *   1. `ConfigProvider` / `DisabledContext` / `FormItemInputContext` 三条上下文；
 *   2. `useSize` / `useVariant` / `useAllowClear` / `useZIndex` 四个 hook；
 *   3. 语义槽（`classNames` / `styles` 的 4 个键）；
 *   4. 类名的拼装（`-sm` / `-lg` / `-disabled` / `-focused` / `-rtl` / variant / status）；
 *   5. `loading` 态对 options / children / filterOption 的三处替换；
 *   6. `notFoundContent` 的 `renderEmpty('Select')` 兜底。
 *
 * ── 与上游的三处**必守**细节 ───────────────────────────────────────────────────
 *
 * 1. `silent={loading}` —— loading 时 Enter **不选中**（引擎里 `props.silent` 直接 return）。
 * 2. `filterOption` 在 loading 时被**整个替换**成恒真函数（不是叠加）。
 * 3. `classNames` 传给引擎时**多三个键**（`mentions` / `variant` / `affixWrapper`）——
 *    它们是引擎内部的通道（`mentions` 是 `-disabled/-focused/-rtl` 的载体），
 *    **不在**公开的语义类型里。
 *
 * ⚠️ `Mentions.Option` 已 deprecated：`children` 非空时告警（`warning.deprecated`）。
 *    注意判据是 `!children`（**有 children 才告警**，与 antd 一致）。
 */

import { useZIndex } from '@apollo-design/portal';
import { useDevWarning } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  type VNodeChild,
} from 'vue';
import { useAllowClear } from '../_internal/use-allow-clear';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { DefaultRenderEmpty } from '../config-provider/default-render-empty';
import { useDisabled } from '../config-provider/disabled-context';
import { useSize } from '../config-provider/size-context';
import { getMergedStatus, useFormItemInputContext } from '../form/context';
import { useVariant } from '../form/hooks/useVariants';
import { getStatusClassNames } from '../space/statusUtils';
import Spin from '../spin';
import { MentionsOption, RcMentions } from './engine/Mentions';
import type {
  MentionsOptionProps,
  MentionsProps,
  MentionsRef,
  MentionsSemanticClassNames,
  MentionsSemanticClassNamesFn,
  MentionsSemanticStyles,
  MentionsSemanticStylesFn,
} from './interface';

/** loading 时的过滤函数：恒真（候选只有「加载中」那一条）。 */
function loadingFilterOption(): boolean {
  return true;
}

export const MentionsComponent = defineComponent({
  name: 'AMentions',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<MentionsProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<MentionsProps['styles']>, default: undefined },
    // ---- 值 / 尺寸 / 状态 ----
    value: { type: String as PropType<string | undefined>, default: undefined },
    defaultValue: { type: String as PropType<string | undefined>, default: undefined },
    size: { type: String as PropType<MentionsProps['size']>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    readOnly: { type: Boolean, default: undefined },
    /** @deprecated 用 `variant`。 */
    bordered: { type: Boolean, default: undefined },
    variant: { type: String as PropType<MentionsProps['variant']>, default: undefined },
    status: { type: String as PropType<MentionsProps['status']>, default: undefined },
    allowClear: {
      type: [Boolean, Object] as PropType<MentionsProps['allowClear']>,
      default: undefined,
    },
    loading: { type: Boolean, default: undefined },
    // ---- 候选 ----
    options: { type: Array as PropType<MentionsOptionProps[]>, default: undefined },
    notFoundContent: {
      type: null as unknown as PropType<VNodeChild>,
      default: undefined,
    },
    prefix: { type: [String, Array] as PropType<string | string[]>, default: undefined },
    split: { type: String, default: undefined },
    silent: { type: Boolean, default: undefined },
    filterOption: {
      type: [Boolean, Function] as PropType<MentionsProps['filterOption']>,
      default: undefined,
    },
    validateSearch: {
      type: Function as PropType<MentionsProps['validateSearch']>,
      default: undefined,
    },
    // ---- 浮层 ----
    placement: { type: String as PropType<MentionsProps['placement']>, default: undefined },
    getPopupContainer: {
      type: Function as PropType<MentionsProps['getPopupContainer']>,
      default: undefined,
    },
    popupClassName: { type: String, default: undefined },
    popupRender: { type: Function as PropType<MentionsProps['popupRender']>, default: undefined },
    onPopupScroll: {
      type: Function as PropType<MentionsProps['onPopupScroll']>,
      default: undefined,
    },
    // ---- 事件 ----
    onChange: { type: Function as PropType<MentionsProps['onChange']>, default: undefined },
    onSelect: { type: Function as PropType<MentionsProps['onSelect']>, default: undefined },
    onSearch: { type: Function as PropType<MentionsProps['onSearch']>, default: undefined },
    // ---- 从 TextArea 继承、需要显式转发的 ----
    maxLength: { type: Number, default: undefined },
    rows: { type: Number, default: undefined },
    autoSize: {
      type: [Boolean, Object] as PropType<MentionsProps['autoSize']>,
      default: undefined,
    },
    autoComplete: { type: String, default: undefined },
    hidden: { type: Boolean, default: undefined },
    placeholder: { type: String, default: undefined },
    count: { type: Object as PropType<MentionsProps['count']>, default: undefined },
    onPressEnter: { type: Function as PropType<MentionsProps['onPressEnter']>, default: undefined },
    onResize: { type: Function as PropType<MentionsProps['onResize']>, default: undefined },
  },
  emits: ['update:value'],
  setup(props, { attrs, emit, expose, slots }) {
    const devWarning = useDevWarning('Mentions');
    // ⚠️ 判据是「有 children 才告警」（上游 `warning.deprecated(!children, ...)`）
    devWarning.deprecated(!slots.default, 'Mentions.Option', 'options');

    const context = useComponentConfig<{
      className?: string;
      style?: CSSProperties;
      classNames?: MentionsSemanticClassNames | MentionsSemanticClassNamesFn;
      styles?: MentionsSemanticStyles | MentionsSemanticStylesFn;
      allowClear?: boolean | { clearIcon?: VNodeChild; disabled?: boolean };
    }>('mentions');
    const { getPrefixCls } = context;
    const direction = useDirection();
    const contextDisabled = useDisabled();
    const formItemContext = useFormItemInputContext();

    const prefixCls = computed(() => getPrefixCls('mentions', props.prefixCls));
    const mergedSize = useSize((ctx) => props.size ?? ctx);
    const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);
    const mergedStatus = computed(() =>
      getMergedStatus(formItemContext.value.status, props.status),
    );

    // ============================ Semantic ============================
    const mergedProps = computed<MentionsProps>(
      () =>
        ({
          ...props,
          disabled: mergedDisabled.value,
          status: mergedStatus.value,
          variant: props.variant,
        }) as MentionsProps,
    );
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      MentionsProps,
      MentionsSemanticClassNames,
      MentionsSemanticStyles
    >(
      [() => context.classNames as MentionsSemanticClassNames | undefined, () => props.classNames],
      [
        () => context.styles as MentionsSemanticStyles | undefined,
        () => semanticRootStyle(undefined),
        () => props.styles,
        // 根 style 是 Vue 原生 attrs（仍走语义 root 通道，与上游落点一致）
        () => semanticRootStyle(attrs.style as CSSProperties),
      ],
      mergedProps.value,
    );

    const { variant, enableVariantCls } = useVariant({
      component: 'mentions',
      variant: () => props.variant,
      legacyBordered: () => props.bordered,
    });

    const mergedAllowClear = useAllowClear({
      allowClear: props.allowClear,
      contextAllowClear: context.allowClear,
      defaultAllowClear: false,
      componentName: 'Mentions',
    });

    const zIndex = useZIndex(
      'SelectLike',
      () => mergedStyles.value.popup?.zIndex as number | undefined,
    );

    // ============================ Not Found ===========================
    const notFoundContentEle = computed<VNodeChild>(() => {
      if (props.notFoundContent !== undefined) {
        return props.notFoundContent;
      }
      const fromContext = context.renderEmpty?.('Select') as VNodeChild;
      return fromContext ?? h(DefaultRenderEmpty, { componentName: 'Select' });
    });

    // ============================ Options =============================
    const mergedOptions = computed<MentionsOptionProps[] | undefined>(() => {
      if (props.loading) {
        return [
          {
            value: 'ANTD_SEARCHING',
            disabled: true,
            label: h(Spin, { size: 'small' }),
          },
        ];
      }
      return props.options;
    });

    const mentionsFilterOption = computed(() =>
      props.loading ? loadingFilterOption : props.filterOption,
    );

    // ============================= Focus ==============================
    const focused = ref(false);
    const onFocus = (event: FocusEvent): void => {
      (attrs as { onFocus?: (e: FocusEvent) => void }).onFocus?.(event);
      focused.value = true;
    };
    const onBlur = (event: FocusEvent): void => {
      (attrs as { onBlur?: (e: FocusEvent) => void }).onBlur?.(event);
      focused.value = false;
    };

    const innerRef = ref<MentionsRef | null>(null);
    expose({
      focus: () => (innerRef.value as { focus?: () => void } | null)?.focus?.(),
      blur: () => (innerRef.value as { blur?: () => void } | null)?.blur?.(),
      get textarea() {
        return (
          (innerRef.value as { textarea?: HTMLTextAreaElement | null } | null)?.textarea ?? null
        );
      },
      get nativeElement() {
        return (
          (innerRef.value as { nativeElement?: HTMLElement | null } | null)?.nativeElement ?? null
        );
      },
    });

    return () => {
      const p = prefixCls.value;
      const mc: MentionsSemanticClassNames = mergedClassNames.value;
      const ms: MentionsSemanticStyles = mergedStyles.value;
      const hasFeedback = formItemContext.value.hasFeedback === true;

      const suffixNode = hasFeedback
        ? (formItemContext.value.feedbackIcon as VNodeChild)
        : undefined;

      const mergedClassName = [
        context.className,
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        attrs.class,
        `${p}-css-var`,
        mc.root,
        {
          [`${p}-sm`]: mergedSize.value === 'small',
          [`${p}-lg`]: mergedSize.value === 'large',
        },
      ];

      /** 传给引擎的类名（比公开的语义类型多 3 个内部键，见文件头 §3）。 */
      const engineClassNames = {
        textarea: mc.textarea,
        popup: [mc.popup, props.popupClassName, `${p}-css-var`],
        suffix: mc.suffix,
        // 引擎内部通道：`-disabled` / `-focused` / `-rtl`
        mentions: {
          [`${p}-disabled`]: mergedDisabled.value,
          [`${p}-focused`]: focused.value,
          [`${p}-rtl`]: direction.value === 'rtl',
        },
        variant: [
          { [`${p}-${variant.value}`]: enableVariantCls.value },
          getStatusClassNames(p, mergedStatus.value),
        ],
        affixWrapper: undefined,
      };

      const engineStyles = {
        textarea: ms.textarea,
        popup: { ...(ms.popup ?? {}), zIndex: zIndex.value },
        suffix: ms.suffix,
      };

      // ⚠️ 末尾的 `...restAttrs` 会**覆盖** `className` / `style`（对象展开后者胜）
      //    ⇒ 必须先把 `class` / `style` 摘掉，否则整条 mergedClassName 被顶掉。
      const {
        class: _attrsClass,
        style: _attrsStyle,
        ...restAttrs
      } = attrs as Record<string, unknown>;
      void _attrsClass;
      void _attrsStyle;

      return h(
        RcMentions,
        {
          ...restAttrs,
          ref: innerRef,
          silent: props.loading,
          prefixCls: p,
          notFoundContent: notFoundContentEle.value,
          className: mergedClassName,
          disabled: mergedDisabled.value,
          allowClear: mergedAllowClear.value,
          direction: direction.value,
          style: ms.root,
          popupRender: props.popupRender,
          filterOption: mentionsFilterOption.value,
          onFocus,
          onBlur,
          value: props.value,
          defaultValue: props.defaultValue,
          options: mergedOptions.value,
          suffix: suffixNode,
          styles: engineStyles as never,
          classNames: engineClassNames as never,
          // ---- 显式转发（声明过的 prop 不会落进 attrs）----
          onChange: (nextValue: string) => {
            emit('update:value', nextValue);
            props.onChange?.(nextValue);
          },
          onSelect: props.onSelect,
          onSearch: props.onSearch,
          onPopupScroll: props.onPopupScroll,
          onPressEnter: props.onPressEnter,
          onResize: props.onResize,
          onClear: (attrs as { onClear?: () => void }).onClear,
          readOnly: props.readOnly,
          maxLength: props.maxLength,
          rows: props.rows,
          autoSize: props.autoSize,
          autoComplete: props.autoComplete,
          hidden: props.hidden,
          placeholder: props.placeholder,
          count: props.count,
          prefix: props.prefix,
          split: props.split,
          validateSearch: props.validateSearch,
          placement: props.placement,
          getPopupContainer: props.getPopupContainer,
        } as never,
        {
          default: () => {
            if (props.loading) {
              return [
                h(MentionsOption, { value: 'ANTD_SEARCHING', disabled: true } as never, {
                  default: () => h(Spin, { size: 'small' }),
                }),
              ];
            }
            return slots.default?.() ?? [];
          },
        },
      );
    };
  },
});

export default MentionsComponent;
