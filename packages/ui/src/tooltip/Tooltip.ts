/**
 * Tooltip 主实现 —— antd 6.6.4 `components/tooltip/index.tsx`（436 行）的 Vue 版。
 *
 * 结构：Trigger（`_internal/trigger.ts`，本仓对 rc-trigger 的组装）之上薄薄一层：
 * placements 记忆、arrow 合并、颜色解析、语义合并、zIndex、noTitle 抑制、
 * `-open` 类与 aria-describedby 注入、deprecated 告警 ×4。
 *
 * 与 antd 的差异（COMPATIBILITY §9.2 登记过的汇总）：
 * - flushSync 无对应物（Vue 响应式同步即等价，D74 同判）；
 * - TableMeasureRowContext（table 测量行抑制）恒 false（table 未落地，D 登记）；
 * - UniqueProvider / `unique` 性能优化 v1 不做（overlay-contract §8 P4）。
 */

import type { OverlayActionInput } from '@apollo-design/overlay';
import { useZIndex } from '@apollo-design/portal';
import { getPlacements } from '@apollo-design/position';
import { getDesignToken } from '@apollo-design/theme';
import { devUseWarning, isDev, useControlledValue } from '@apollo-design/utils';
import {
  type CSSProperties,
  cloneVNode,
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  shallowRef,
  type VNode,
  type VNodeChild,
} from 'vue';
import { Trigger, type TriggerAlign } from '../_internal/trigger';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import type {
  TooltipClassNames,
  TooltipPlacement,
  TooltipProps,
  TooltipRef,
  TooltipSemanticType,
  TooltipStyles,
} from './interface';
import PurePanel from './PurePanel';
import { tooltipTokenValues } from './style/token';
import { useMergedArrow } from './use-merged-arrow';
import { clsx, parseTooltipColor } from './util';

type StyleLike = Record<string, string | number>;

function isFragmentNode(node: VNode | null | undefined): boolean {
  return node !== null && node !== undefined && node.type === Symbol.for('v-fgt');
}

const Tooltip = defineComponent({
  name: 'ATooltip',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    title: {
      type: [Object, String, Number, Function] as PropType<VNodeChild | (() => VNodeChild)>,
      default: undefined,
    },
    overlay: {
      type: [Object, String, Number, Function] as PropType<VNodeChild | (() => VNodeChild)>,
      default: undefined,
    },
    trigger: { type: [String, Array] as PropType<string | string[]>, default: undefined },
    placement: { type: String as PropType<TooltipPlacement>, default: undefined },
    arrow: {
      type: [Boolean, Object] as PropType<boolean | { pointAtCenter?: boolean }>,
      default: undefined,
    },
    color: { type: String, default: undefined },
    autoAdjustOverflow: {
      type: [Boolean, Object] as PropType<boolean | object>,
      default: undefined,
    },
    builtinPlacements: {
      type: Object as PropType<Record<string, TriggerAlign>>,
      default: undefined,
    },
    align: { type: Object as PropType<TriggerAlign>, default: undefined },
    getPopupContainer: {
      type: Function as PropType<(triggerNode: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    getTooltipContainer: {
      type: Function as PropType<(triggerNode: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    openClassName: { type: String, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    destroyTooltipOnHide: {
      type: [Boolean, Object] as PropType<boolean | { keepParent?: boolean }>,
      default: undefined,
    },
    mouseEnterDelay: { type: Number, default: undefined },
    mouseLeaveDelay: { type: Number, default: undefined },
    motion: { type: Object as PropType<{ motionName?: string }>, default: undefined },
    zIndex: { type: Number, default: undefined },
    id: { type: String, default: undefined },
    onPopupClick: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
    fresh: { type: Boolean, default: undefined },
    forceRender: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<StyleLike>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<TooltipClassNames>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<TooltipStyles>, default: undefined },
    overlayStyle: { type: Object as PropType<StyleLike>, default: undefined },
    overlayInnerStyle: { type: Object as PropType<StyleLike>, default: undefined },
    overlayClassName: { type: String, default: undefined },
  },
  emits: {
    'update:open': (_open: boolean) => true,
    // ⚠️ `onOpenChange` / `afterOpenChange` 走纯 prop 回调，不声明 emit（CHECKLIST #78）
  },
  setup(props, { slots, attrs, expose, emit }) {
    if (isDev) {
      const warning = devUseWarning('Tooltip');
      const deprecations: Array<[string, string]> = [
        ['overlayStyle', 'styles.root'],
        ['overlayInnerStyle', 'styles.container'],
        ['overlayClassName', 'classNames.root'],
        ['destroyTooltipOnHide', 'destroyOnHidden'],
      ];
      const values: Record<string, unknown> = props as Record<string, unknown>;
      for (const [deprecatedName, newName] of deprecations) {
        if (values[deprecatedName] !== undefined) {
          warning.deprecated(false, deprecatedName, newName);
        }
      }
    }

    const context = useComponentConfig('tooltip');
    const direction = useDirection();
    const { getPrefixCls } = context;

    // rc：injectFromPopover 时跳过 tooltip 专属语义（Popover 注入场景）—— v1 无
    // Popover，context 全量生效。
    const contextSemantic = context as {
      classNames?: TooltipSemanticType['classNames'];
      styles?: TooltipSemanticType['styles'];
      arrow?: boolean | { pointAtCenter?: boolean };
      trigger?: string | string[];
      mouseEnterDelay?: number;
      mouseLeaveDelay?: number;
      getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
      className?: string;
      style?: StyleLike;
    };

    const prefixCls = props.prefixCls ?? getPrefixCls('tooltip');

    // ============================ Merge ==============================
    const mergedMouseEnterDelay = computed(
      () => props.mouseEnterDelay ?? contextSemantic.mouseEnterDelay ?? 0.1,
    );
    const mergedMouseLeaveDelay = computed(
      () => props.mouseLeaveDelay ?? contextSemantic.mouseLeaveDelay ?? 0.1,
    );
    const mergedArrow = useMergedArrow(
      () => props.arrow,
      () => contextSemantic.arrow,
    );
    const mergedShowArrow = computed(() => mergedArrow.value.show);
    const mergedTrigger = computed(() => props.trigger || contextSemantic.trigger || 'hover');
    const mergedGetPopupContainer = computed(
      () =>
        props.getPopupContainer ?? props.getTooltipContainer ?? contextSemantic.getPopupContainer,
    );
    const mergedDestroyOnHidden = computed(
      () => props.destroyOnHidden ?? !!props.destroyTooltipOnHide,
    );

    // ============================ Warn ===============================
    // destroyTooltipOnHide 的 keepParent 对象形态：antd 只告警不拦截（warning 非
    // boolean 即告警）。这里合并进 mergedDestroyOnHidden 的 !! 已足够。

    // antd：noTitle = !title && !overlay && title !== 0（title=0 合法内容）
    const noTitle = computed(() => {
      const t = props.title;
      if (t === 0) return false;
      if (t) return false;
      return !props.overlay;
    });

    // ============================ Open ===============================
    // ⚠️ noTitle 抑制在 onChange 里：antd 的 onInternalOpenChange 是
    // `setOpen(noTitle ? false : next)` 且 noTitle 时**不调** onOpenChange。
    const [mergedOpen, setOpen] = useControlledValue<boolean>({
      defaultValue: () => props.defaultOpen ?? false,
      getValue: () => props.open,
      onChange: (next: boolean) => {
        if (noTitle.value) {
          return;
        }
        props.onOpenChange?.(next);
        emit('update:open', next);
      },
    });
    const onInternalOpenChange = (nextOpen: boolean): void => {
      setOpen(noTitle.value ? false : nextOpen);
      if (!noTitle.value && props.onOpenChange) {
        props.onOpenChange(nextOpen);
      }
    };

    // ========================= Placements ============================
    const seed = getDesignToken() as unknown as {
      sizePopupArrow: number;
      borderRadius: number;
      marginXXS: number;
    };
    const tooltipPlacements = computed<Record<string, TriggerAlign>>(() => {
      return (
        props.builtinPlacements ||
        getPlacements({
          arrowPointAtCenter: mergedArrow.value.pointAtCenter ?? false,
          autoAdjustOverflow:
            props.autoAdjustOverflow === undefined ? true : props.autoAdjustOverflow,
          arrowWidth: mergedShowArrow.value ? seed.sizePopupArrow : 0,
          borderRadius: seed.borderRadius,
          offset: seed.marginXXS,
          visibleFirst: true,
        })
      );
    });

    // ============================ zIndex =============================
    const zIndex = useZIndex('Tooltip', () => props.zIndex, {
      zIndexPopupBase: tooltipTokenValues().zIndexPopup,
    });

    // =========================== Content =============================
    const memoOverlay = computed<VNodeChild>(() => {
      if (props.title === 0) {
        return 0;
      }
      const overlay = props.overlay ?? props.title ?? '';
      return typeof overlay === 'function' ? (overlay as () => VNodeChild)() : overlay;
    });

    // ======================== Merged Semantic ========================
    const colorInfo = computed(() => parseTooltipColor(prefixCls, props.color));
    const contextStyleRoot = contextSemantic.style;
    const overlayStyleRoot = props.overlayStyle;

    const mergedProps = computed<TooltipProps>(() => ({
      ...props,
      trigger: mergedTrigger.value,
      builtinPlacements: tooltipPlacements.value,
      getPopupContainer: mergedGetPopupContainer.value,
      destroyOnHidden: mergedDestroyOnHidden.value,
      mouseEnterDelay: mergedMouseEnterDelay.value,
      mouseLeaveDelay: mergedMouseLeaveDelay.value,
    }));
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      TooltipProps,
      NonNullable<TooltipSemanticType['classNames']>,
      NonNullable<TooltipSemanticType['styles']>
    >(
      [
        () => contextSemantic.classNames,
        () => props.classNames as TooltipSemanticType['classNames'] | undefined,
        () => (props.overlayClassName ? { root: props.overlayClassName } : undefined),
      ],
      [
        () => contextSemantic.styles,
        () => (contextStyleRoot ? { root: contextStyleRoot } : undefined),
        () => props.styles as TooltipSemanticType['styles'] | undefined,
        () => (overlayStyleRoot ? { root: overlayStyleRoot } : undefined),
      ],
      mergedProps.value,
    );

    const rootClassNames = computed(() =>
      clsx(
        props.overlayClassName,
        direction.value === 'rtl' && `${prefixCls}-rtl`,
        colorInfo.value.className,
        props.rootClassName,
        contextSemantic.className,
        mergedClassNames.value.root,
        props.className,
        typeof attrs.class === 'string' ? attrs.class : undefined,
      ),
    );

    const containerStyle = computed<StyleLike>(() => ({
      ...(mergedStyles.value.container ?? {}),
      ...(props.overlayInnerStyle ?? {}),
      ...(colorInfo.value.overlayStyle as StyleLike),
    }));

    // ========================= tempOpen ==============================
    // rc：受控时不做 noTitle 压制（受控方自己负责）；非受控 + noTitle ⇒ 强制关。
    const tempOpen = computed(() => {
      if (props.open !== undefined) {
        return props.open && !noTitle.value;
      }
      return mergedOpen.value && !noTitle.value;
    });

    // =========================== Expose ==============================
    const triggerRef = shallowRef<TooltipRef | null>(null);
    expose({
      forceAlign: () => triggerRef.value?.forceAlign(),
      // antd 的 TooltipRef.nativeElement 是**属性** —— expose 的 computed 自动解包
      nativeElement: computed(() => triggerRef.value?.nativeElement ?? null),
      popupElement: computed(() => triggerRef.value?.popupElement ?? null),
    });

    return () => {
      // 触发元素：default slot 首个 vnode；非元素 / fragment 包一层 span（rc 同款）。
      const children = slots.default?.();
      const first = Array.isArray(children) ? children[0] : children;
      const child =
        first && isVNode(first) && !isFragmentNode(first)
          ? (first as VNode)
          : h(
              'span',
              [first as VNodeChild].filter((c) => c !== null && c !== undefined),
            );

      // -open 类：开（或受控开）时追加（antd 判 `'open' in props` 的口径 ——
      // 受控与否都加，区别只在 noTitle 抑制后的 tempOpen）。
      const childProps = (child.props ?? {}) as { class?: unknown; 'aria-describedby'?: string };
      const openCls =
        tempOpen.value || (props.openClassName !== undefined && mergedOpen.value)
          ? (props.openClassName ?? `${prefixCls}-open`)
          : '';
      const childClass =
        typeof childProps.class === 'string' ? clsx(childProps.class, openCls) : childProps.class;
      const describedBy = [
        childProps['aria-describedby'],
        tempOpen.value ? (props.id ?? 'apollo-tooltip') : undefined,
      ]
        .filter(Boolean)
        .join(' ');

      const triggerNode = cloneVNode(child, {
        class: childClass,
        'aria-describedby': describedBy || undefined,
      });

      const arrowProp = mergedShowArrow.value
        ? {
            content: h('span', { class: `${prefixCls}-arrow-content` }),
            style: colorInfo.value.arrowStyle as StyleLike,
          }
        : undefined;

      const popup = h(
        'div',
        {
          id: props.id ?? 'apollo-tooltip',
          class: clsx(`${prefixCls}-container`, mergedClassNames.value.container),
          style: containerStyle.value as CSSProperties,
          role: 'tooltip',
          onClick: props.onPopupClick ? (e: MouseEvent) => props.onPopupClick?.(e) : undefined,
        },
        [memoOverlay.value as VNodeChild].filter((c) => c !== null && c !== undefined),
      );

      return h(
        Trigger,
        {
          ref: triggerRef as never,
          prefixCls,
          popup,
          // antd 的 ActionType 是 string，本仓只认 5 种动作 —— 未知动作在
          // resolveActions 里静默 no-op（语义安全），窄化 cast 登记 COMPATIBILITY
          action: mergedTrigger.value as OverlayActionInput,
          open: tempOpen.value,
          onOpenChange: onInternalOpenChange,
          afterOpenChange: props.afterOpenChange,
          disabled: props.disabled,
          mouseEnterDelay: mergedMouseEnterDelay.value,
          mouseLeaveDelay: mergedMouseLeaveDelay.value,
          placement: props.placement ?? 'top',
          builtinPlacements: tooltipPlacements.value,
          popupAlign: props.align,
          getPopupContainer: mergedGetPopupContainer.value,
          motion: {
            motionName: props.motion?.motionName ?? `${prefixCls}-zoom-big-fast`,
            motionDeadline: 1000,
          },
          destroyOnHidden: mergedDestroyOnHidden.value,
          fresh: props.fresh,
          forceRender: props.forceRender,
          arrow: arrowProp,
          zIndex: zIndex.value,
          popupClassName: rootClassNames.value,
          popupStyle: {
            ...(colorInfo.value.arrowStyle as StyleLike),
            ...(mergedStyles.value.root ?? {}),
          },
          style: props.style,
          ...attrs,
        },
        {
          default: () => [triggerNode],
        },
      );
    };
  },
});

export default Tooltip;
