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
import {
  devUseWarning,
  isDev,
  isEmptyVNode,
  isRenderable,
  useControlledValue,
} from '@apollo-design/utils';
import {
  Comment,
  type CSSProperties,
  cloneVNode,
  computed,
  defineComponent,
  h,
  type InjectionKey,
  inject,
  isVNode,
  normalizeClass,
  type PropType,
  provide,
  shallowRef,
  Text,
  useId,
  type VNode,
  type VNodeChild,
} from 'vue';
import { clsx } from '../_internal/clsx';
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
import { tooltipTokenValues } from './style/token';
import { useMergedArrow } from './use-merged-arrow';
import { parseTooltipColor } from './util';

type StyleLike = Record<string, string | number>;

function isFragmentNode(node: VNode | null | undefined): boolean {
  return node !== null && node !== undefined && node.type === Symbol.for('v-fgt');
}

/**
 * Popover / Popconfirm 注入标记 —— antd 的 `data-popover-inject` prop 在 Vue 侧的
 * 等价物（Issue #24.4）。上游据此跳过 ConfigProvider `components.tooltip` 的**专属**
 * 语义配置（className/style/classNames/styles/arrow/trigger/延迟），防止它们泄漏进
 * Popover/Popconfirm；公共通道（`getPopupContainer` / `direction` / `getPrefixCls`）
 * 不受影响。用 provide/inject 而不是 prop ⇒ 不污染公开 props 面。
 */
export const tooltipInjectKey: InjectionKey<boolean> = Symbol('apollo-tooltip-inject');

/** 供 Popover / Popconfirm 声明「我是注入方」。 */
export function provideTooltipInjection(): void {
  provide(tooltipInjectKey, true);
}

/**
 * 复刻 React `cloneElement` 的**替换**语义。
 *
 * ⚠️ Vue 的 `cloneVNode` 走 `mergeProps`：同类键是**合并** —— `class` 会被拼两遍
 *    （实测 `u-a u-on u-a u-on`）、`on*` 会被拼成数组（双调）。antd 的
 *    `cloneElement(child, { className: clsx(...) })` 是替换（#24.7；仓库既有判据：
 *    transfer #15.1 / FormItem #8.3）。
 *
 * 先 `cloneVNode`（保留 dirs / transition / ref / key / el），再整体替换 `props`
 * —— 比 `createVNode` 重建安全（后者会丢 `dirs`，破坏子元素上的 `v-model`）。
 */
function cloneWithProps(child: VNode, extra: Record<string, unknown>): VNode {
  const cloned = cloneVNode(child);
  cloned.props = { ...((child.props as Record<string, unknown> | null) ?? {}), ...extra };
  return cloned;
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
    // C8-R2：title 收窄 String（富内容 / 0 值走 `#title` 插槽）；deprecated overlay 删除
    title: { type: String, default: undefined },
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

    // ⚠️ antd（`tooltip/index.js:63-73`）：从 Popover/Popconfirm 注入时
    //    `injectFromPopover` ⇒ 专属语义配置整组置空（className / style /
    //    classNames / styles / arrow / trigger / 两个延迟），只留公共通道
    //    `getPopupContainer` / `getPrefixCls` / `direction`（Issue #24.4）。
    const injectFromPopover = inject(tooltipInjectKey, false);
    const semanticConfig: typeof contextSemantic = injectFromPopover ? {} : contextSemantic;

    const prefixCls = props.prefixCls ?? getPrefixCls('tooltip');

    // ============================ Merge ==============================
    const mergedMouseEnterDelay = computed(
      () => props.mouseEnterDelay ?? semanticConfig.mouseEnterDelay ?? 0.1,
    );
    const mergedMouseLeaveDelay = computed(
      () => props.mouseLeaveDelay ?? semanticConfig.mouseLeaveDelay ?? 0.1,
    );
    const mergedArrow = useMergedArrow(
      () => props.arrow,
      () => semanticConfig.arrow,
    );
    const mergedShowArrow = computed(() => mergedArrow.value.show);
    const mergedTrigger = computed(() => props.trigger || semanticConfig.trigger || 'hover');
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

    // #title 插槽（C8-R2）：空渲染归一为 undefined ⇒ 视为未提供。
    const titleSlot = computed<unknown>(() => {
      const fn = slots.title;
      if (typeof fn !== 'function') return undefined;
      const nodes = fn();
      if (nodes === undefined) return undefined;
      return isEmptyVNode(nodes) ? undefined : nodes;
    });

    // antd：noTitle = !title && !overlay && title !== 0（title=0 合法内容）。
    // C8-R2 后：内容 = `#title` 插槽 ?? title 文本 prop；「有内容」判据是
    // isRenderable（0 / '0' 有内容，'' / null / false 没有 —— 与 antd 逐字同义）。
    const mergedContent = computed<VNodeChild>(() => {
      if (titleSlot.value !== undefined) return titleSlot.value as VNodeChild;
      return props.title ?? '';
    });
    const noTitle = computed(() => !isRenderable(mergedContent.value));

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
    // ⚠️ 单一回调出口：`setOpen` → `useControlledValue.onChange` 已发过
    //    `onOpenChange` + `update:open`；这里再调一次就会**双通知**（Issue #24.1）。
    //    noTitle 的「不回调」语义由 onChange 里的早退保证。
    const onInternalOpenChange = (nextOpen: boolean): void => {
      setOpen(noTitle.value ? false : nextOpen);
    };

    // ============================ Id =================================
    // ⚠️ rc-tooltip 1.5.2 `Tooltip.js:36`：`const mergedId = useId(id)` —— 未显式
    //    传 id 的实例必须有**唯一** id，否则同页多实例共用 `apollo-tooltip`，
    //    产生重复 ID 与歧义的 `aria-describedby`（Issue #24.2）。显式 id 始终优先。
    const innerId = useId();
    const mergedId = computed(() => props.id ?? `${prefixCls}-${innerId}`);

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
    const memoOverlay = computed<VNodeChild>(() => mergedContent.value);

    // ======================== Merged Semantic ========================
    const colorInfo = computed(() => parseTooltipColor(prefixCls, props.color));
    const contextStyleRoot = semanticConfig.style;
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
        () => semanticConfig.classNames,
        () => props.classNames as TooltipSemanticType['classNames'] | undefined,
        () => (props.overlayClassName ? { root: props.overlayClassName } : undefined),
      ],
      [
        () => semanticConfig.styles,
        () => (contextStyleRoot ? { root: contextStyleRoot } : undefined),
        () => props.styles as TooltipSemanticType['styles'] | undefined,
        () => (overlayStyleRoot ? { root: overlayStyleRoot } : undefined),
      ],
      // ⚠️ 传 **computed 本身**（不是 `.value`）：函数式变体每次重算都要看到当前
      //    props；传 setup 期快照会让后续 props 变化在函数式里不可见（Issue #26.3）。
      mergedProps,
    );

    const rootClassNames = computed(() =>
      clsx(
        props.overlayClassName,
        direction.value === 'rtl' && `${prefixCls}-rtl`,
        colorInfo.value.className,
        semanticConfig.className,
        mergedClassNames.value.root,
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        typeof attrs.class === 'string' ? attrs.class : undefined,
      ),
    );

    const containerStyle = computed<StyleLike>(() => ({
      ...(mergedStyles.value.container ?? {}),
      ...(props.overlayInnerStyle ?? {}),
      ...(colorInfo.value.overlayStyle as StyleLike),
    }));

    // ========================= tempOpen ==============================
    // antd（es/tooltip/index.js 逐字）：`let tempOpen = open;
    //   if (!('open' in props) && noTitle || inTableMeasureRow) tempOpen = false;`
    // —— 受控时**不做** noTitle 压制（受控方自己负责；Popover 传 open ⇒ 受控），
    // 只有非受控 + noTitle 才强制关。
    const tempOpen = computed(() => {
      if (props.open !== undefined) {
        return props.open;
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
      // 触发元素：default slot 的**全部**节点。
      // ⚠️ 原来写 `children[0]` ⇒ 多节点默认插槽会静默丢掉其余兄弟（Issue #24.3）。
      //    rc 的 `Children.only` 语义在 Vue 侧的等价处理：单「真实元素」直接用，
      //    其余（多节点 / Fragment / Text / Comment）整体包一层 span。
      // ⚠️ 字符串插槽经 Vue 编译是 **Text vnode**（type = Symbol(v-txt)）——
      //    必须与 fragment 一样包一层 span（rc 的 isValidElement 判据在 Vue 里是
      //    「真实元素 vnode」：排除 Text / Comment / Fragment）。
      const children = slots.default?.() as unknown[] | undefined;
      const childList = (
        Array.isArray(children)
          ? children
          : children === null || children === undefined
            ? []
            : [children]
      ).filter((c): c is VNodeChild => c !== null && c !== undefined && c !== false && c !== true);
      const single = childList.length === 1 ? childList[0] : null;
      const singleType = isVNode(single) ? (single as VNode).type : null;
      const isRealElement =
        isVNode(single) &&
        !isFragmentNode(single as VNode) &&
        singleType !== Text &&
        singleType !== Comment;
      const child: VNode = isRealElement ? (single as VNode) : h('span', childList);

      // -open 类：开（或受控开）时追加（antd 判 `'open' in props` 的口径 ——
      // 受控与否都加，区别只在 noTitle 抑制后的 tempOpen）。
      // ⚠️ `normalizeClass` 而不是「字符串才 clsx」的分支：任意形态（数组 / 对象 /
      //    嵌套）都正确合并，且**不覆写**用户 class（Issue #24.7）。
      const childProps = (child.props ?? {}) as { class?: unknown; 'aria-describedby'?: string };
      const openCls =
        tempOpen.value || (props.openClassName !== undefined && mergedOpen.value)
          ? (props.openClassName ?? `${prefixCls}-open`)
          : '';
      const childClass = normalizeClass([childProps.class, openCls]);
      const describedBy = [
        childProps['aria-describedby'],
        tempOpen.value ? mergedId.value : undefined,
      ]
        .filter(Boolean)
        .join(' ');

      const triggerNode = cloneWithProps(child, {
        class: childClass || undefined,
        'aria-describedby': describedBy || undefined,
      });

      // ⚠️ rc-tooltip 1.5.2 `Tooltip.js:51-63`：语义 arrow 的 class/style 要并进
      //    arrow 配置（`clsx(arrowConfig.className, classNames?.arrow)` /
      //    `{...arrowConfig.style, ...styles?.arrow}`）—— 原来只传颜色样式，
      //    `classNames.arrow` / `styles.arrow` 全丢（Issue #24.6）。
      const arrowProp = mergedShowArrow.value
        ? {
            content: h('span', { class: `${prefixCls}-arrow-content` }),
            className: mergedClassNames.value.arrow,
            style: {
              ...(colorInfo.value.arrowStyle as StyleLike),
              ...(mergedStyles.value.arrow ?? {}),
            },
          }
        : undefined;

      const popup = h(
        'div',
        {
          id: mergedId.value,
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
          // 根 style 是 Vue 原生 attrs（`...attrs` 在末尾，位置与原先的 props.style 一致）
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
