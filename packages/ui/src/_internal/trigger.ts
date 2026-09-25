/**
 * `Trigger` —— `@rc-component/trigger@3.10.1` 的 Vue 等价物（tooltip 的第一消费者，
 * dropdown / select / cascader / date-picker 等后续复用）。
 *
 * ── 组装关系（tooltip 的实现 = 组装，见 docs/analysis/tooltip.md §1/§8） ──────
 *
 * | rc 侧 | 本仓承接 |
 * |---|---|
 * | `hooks/useAction` + `useDelay` + `useWinClick` + portal 的 Esc 栈 | `@apollo-design/overlay` 的 `useOverlay()` |
 * | `hooks/useAlign`（几何） | `@apollo-design/position` 的 `measureAlign()` + `alignPopup()`（+ 本文件补齐 offsetR/B） |
 * | `@rc-component/portal` | `@apollo-design/portal` 的 `Portal` |
 * | `@rc-component/motion` 的 CSSMotion | `@apollo-design/motion` 的 `CSSMotion` |
 *
 * ── 与 rc 的已知差异（全部登记过，不要当 bug 修） ─────────────────────────
 *
 * 1. **事件顺序**：rc 的 wrapperAction 是「先 `triggerOpen`，后用户自己的同名
 *    handler」；Vue 的 `cloneVNode` 把事件合并成 `[child 自己的, 我们注入的]`
 *    （`mergeProps` 对后来的追加在后，而 cloneVNode 先 merge(child.props, extra)）
 *    ⇒ 用户 handler 先跑。延迟/开关语义不受影响（PLATFORM，D 候选）。
 * 2. **offsetR/B 的亚像素差**：rc 用未 floor 的原始 offsetX 参与 offsetR/B
 *    计算；`alignPopup` 返回的是已 floor 的值。scale=1（常态）时两边一致，
 *    scale≠1 时差 <1px（analysis §8）。
 * 3. **unique / mask / mobile / stretch** 不做（v1 范围；UniqueProvider 是
 *    性能优化，语义等价）。
 * 4. **回调通道**：内部组件走**纯 prop 回调**（`onOpenChange` 等），不声明
 *    emits —— prop 与 emit 同名会双触发（CHECKLIST #78）。
 *
 * ⚠️ `targetProps` / `popupProps` 的事件键是 **Vue 小写约定**（`onMouseenter`，
 *    overlay-contract §6.1）—— useOverlay 已经按此产出，这里别再改写。
 */

import { CSSMotion } from '@apollo-design/motion';
import { type OverlayActionInput, useOverlay } from '@apollo-design/overlay';
import { Portal } from '@apollo-design/portal';
import {
  type AlignOutcome,
  type AlignType,
  alignPopup,
  collectScroller,
  type FlipMemory,
  measureAlign,
} from '@apollo-design/position';
import { canUseDom } from '@apollo-design/utils';
import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  shallowRef,
  type VNode,
  type VNodeChild,
  watch,
} from 'vue';

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

export type TriggerAlign = AlignType;

export interface TriggerMotion {
  motionName?: string;
  motionDeadline?: number;
  /** 透传 CSSMotion 的 supportMotion（测试里必须显式传 true，jsdom 探测不可靠） */
  supportMotion?: boolean;
}

export interface TriggerArrow {
  className?: string;
  style?: Record<string, string | number>;
  content?: VNodeChild;
}

/** rc `useAlign` 的 offsetInfo。 */
interface OffsetInfo {
  ready: boolean;
  offsetX: number;
  offsetY: number;
  offsetR: number;
  offsetB: number;
  arrowX: number;
  arrowY: number;
  scaleX: number;
  scaleY: number;
  align: TriggerAlign;
}

// ---------------------------------------------------------------------------
// rc `util.js` 的 getAlignPopupClassName（机械移植）
// ---------------------------------------------------------------------------

function isPointsEq(
  a1: readonly string[] = [],
  a2: readonly string[] = [],
  isAlignPoint: boolean,
): boolean {
  const getVal = (a: readonly string[], index: number) => a[index] || '';
  if (isAlignPoint) {
    return getVal(a1, 0) === getVal(a2, 0);
  }
  return getVal(a1, 0) === getVal(a2, 0) && getVal(a1, 1) === getVal(a2, 1);
}

export function getAlignPopupClassName(
  builtinPlacements: Record<string, TriggerAlign>,
  prefixCls: string,
  align: TriggerAlign | undefined,
  isAlignPoint: boolean,
): string {
  const points = align?.points;
  for (const placement of Object.keys(builtinPlacements)) {
    if (isPointsEq(builtinPlacements[placement]?.points, points, isAlignPoint)) {
      return `${prefixCls}-placement-${placement}`;
    }
  }
  return '';
}

// ---------------------------------------------------------------------------
// 组件
// ---------------------------------------------------------------------------

export const Trigger = defineComponent({
  name: 'ATrigger',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    /** 浮层内容（rc 的 `popup`；函数形态每次渲染求值）。 */
    popup: {
      type: [Object, String, Number, Function] as PropType<VNodeChild | (() => VNodeChild)>,
      default: undefined,
    },
    action: { type: [String, Array] as PropType<OverlayActionInput>, default: undefined },
    showAction: { type: [String, Array] as PropType<OverlayActionInput>, default: undefined },
    hideAction: { type: [String, Array] as PropType<OverlayActionInput>, default: undefined },
    /** 受控开合。传了即受控（tooltip 恒受控 —— noTitle 抑制在外层做）。 */
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    /** 单位**秒**。 */
    mouseEnterDelay: { type: Number, default: undefined },
    mouseLeaveDelay: { type: Number, default: undefined },
    focusDelay: { type: Number, default: undefined },
    blurDelay: { type: Number, default: undefined },
    /** 按鼠标位置定位（右键菜单场景）。 */
    alignPoint: { type: Boolean, default: undefined },
    placement: { type: String, default: 'top' },
    /** `getPlacements()` 的产物。 */
    builtinPlacements: { type: Object as PropType<Record<string, TriggerAlign>>, required: true },
    /** 用户 align 浅合并到对应 placement 之上（rc 的 `popupAlign`）。 */
    popupAlign: { type: Object as PropType<TriggerAlign>, default: undefined },
    getPopupContainer: {
      type: Function as PropType<(triggerNode: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    motion: { type: Object as PropType<TriggerMotion>, default: undefined },
    /** 关闭且动画结束后卸载 portal（rc 的 `autoDestroy`）。 */
    destroyOnHidden: { type: Boolean, default: undefined },
    /** 关闭后仍挂载 portal。 */
    forceRender: { type: Boolean, default: undefined },
    /** 关闭时不缓存内容（rc 的 `fresh`）。 */
    fresh: { type: Boolean, default: undefined },
    /**
     * 拉伸协议（rc 的 `stretch`）：'minWidth' ⇒ 浮层 min-width = 目标宽度
     * （dropdown 的 minOverlayWidthMatchTrigger 默认真）。对齐时量测并写入。
     */
    stretch: { type: String as PropType<'minWidth'>, default: undefined },
    /** 箭头。`undefined` 视为无箭头（rc-tooltip 先算好 mergedArrow 再传入）。 */
    arrow: { type: Object as PropType<TriggerArrow>, default: undefined },
    zIndex: { type: Number, default: undefined },
    popupClassName: { type: [String, Array] as PropType<string | string[]>, default: undefined },
    popupStyle: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    onPopupAlign: {
      type: Function as PropType<(popupEle: HTMLElement, align: TriggerAlign) => void>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs, expose }) {
    // ============================ Overlay ============================
    // 开合 / 事件 / 延迟 / Esc / 外部点击 —— 全部委托 overlay。
    const inMotion = ref(false);
    const overlay = useOverlay({
      action: () => props.action,
      showAction: () => props.showAction,
      hideAction: () => props.hideAction,
      open: () => props.open,
      defaultOpen: props.defaultOpen,
      onOpenChange: (next) => props.onOpenChange?.(next),
      disabled: () => props.disabled,
      mouseEnterDelay: () => props.mouseEnterDelay,
      mouseLeaveDelay: () => props.mouseLeaveDelay,
      focusDelay: () => props.focusDelay,
      blurDelay: () => props.blurDelay,
      alignPoint: () => props.alignPoint,
      inMotion: () => inMotion.value,
    });
    const mergedOpen = overlay.open;

    // ============================ Motion ============================
    // rc：useLayoutEffect(firstMount => { if (!firstMount || mergedOpen) setInMotion(true) },
    // [mergedOpen]) —— 首挂且 open=true 也置位；onVisibleChanged 清零。
    watch(mergedOpen, () => {
      inMotion.value = true;
    });
    if (canUseDom() && mergedOpen.value) {
      inMotion.value = true;
    }

    // ============================ Align =============================
    const popupEle = shallowRef<HTMLElement | null>(null);
    const offsetInfo = ref<OffsetInfo>({
      ready: false,
      offsetX: 0,
      offsetY: 0,
      offsetR: 0,
      offsetB: 0,
      arrowX: 0,
      arrowY: 0,
      scaleX: 1,
      scaleY: 1,
      // rc 初始 state 的 align 就是 builtinPlacements[placement] —— placement 类名
      // 不依赖首次对齐成功（jsdom 无布局 ⇒ isVisible 恒 false ⇒ 对齐早退）
      align: props.builtinPlacements[props.placement] ?? {},
    });
    const flipMemory = ref<FlipMemory>({});
    /** stretch='minWidth' 的目标宽度（对齐时量测，rc 的 stretchStyle）。 */
    const stretchMinWidth = ref('');
    const alignCount = ref(0);

    const isMobile = false; // v1 无 mobile 形态（tooltip / dropdown 都没有）

    /** 对齐目标：alignPoint 场景用鼠标位置，否则用触发元素。 */
    // child 是**组件**时，cloneVNode 的 ref 拿到的是组件实例 ⇒ 归一到根元素
    // （antd 用 forwardRef 达成同一效果；Vue 的实例有 ``）。
    const targetElement = computed<HTMLElement | null>(() => {
      const t = overlay.targetRef.value as HTMLElement | { $el?: HTMLElement } | null;
      if (!t) return null;
      if (t instanceof HTMLElement) return t;
      const el = (t as { $el?: HTMLElement }).$el;
      return el instanceof HTMLElement ? el : null;
    });

    const alignTarget = computed<HTMLElement | readonly [number, number] | null>(() => {
      if (props.alignPoint && overlay.mousePos.value) {
        return overlay.mousePos.value;
      }
      return targetElement.value;
    });

    const onAlign = (): void => {
      const ele = popupEle.value;
      const tgt = alignTarget.value;
      if (!ele || !tgt || !mergedOpen.value || isMobile) {
        return;
      }
      // rc：placementInfo = builtinPlacements[placement] 与 popupAlign 浅合并
      const placementInfo: TriggerAlign = {
        ...(props.builtinPlacements[props.placement] ?? {}),
        ...props.popupAlign,
      };
      const result = measureAlign({
        popupEle: ele,
        target: tgt,
        ...(placementInfo.htmlRegion ? { htmlRegion: placementInfo.htmlRegion } : {}),
      });
      if (!result) {
        return;
      }
      const outcome: AlignOutcome = alignPopup(
        {
          target: result.target,
          popup: result.popup,
          visible: result.visible,
          scroll: result.check,
          scaleX: result.scaleX,
          scaleY: result.scaleY,
        },
        placementInfo,
        flipMemory.value,
      );
      flipMemory.value = outcome.flip;

      // ── stretch（rc-trigger 的 stretchStyle：'minWidth' ⇒ 浮层 min-width = 目标宽）──
      // 用 getBoundingClientRect（rc 同款，**不取整** —— offsetWidth 的整数化会让
      // 浮层宽 1px 偏移、L6 逐像素红）。
      if (props.stretch === 'minWidth' && tgt instanceof HTMLElement) {
        stretchMinWidth.value = `${tgt.getBoundingClientRect().width}px`;
      }

      // ── offsetR/B（rc useAlign 尾部公式，AlignOutcome 不含）──
      // rc 用**未 floor** 的原始 offsetX 参与 offsetR/B；alignPopup 已 floor
      // （scale=1 时等价，scale≠1 时亚像素差，见文件头差异 2）。
      const rawOffsetX = outcome.offsetX * result.scaleX;
      const rawOffsetY = outcome.offsetY * result.scaleY;
      let offsetX4Right =
        result.mirror.x + result.mirror.width - result.popup.x - (rawOffsetX + result.popup.width);
      let offsetY4Bottom =
        result.mirror.y +
        result.mirror.height -
        result.popup.y -
        (rawOffsetY + result.popup.height);
      if (result.scaleX === 1) {
        offsetX4Right = Math.floor(offsetX4Right);
      }
      if (result.scaleY === 1) {
        offsetY4Bottom = Math.floor(offsetY4Bottom);
      }

      offsetInfo.value = {
        ready: true,
        offsetX: outcome.offsetX,
        offsetY: outcome.offsetY,
        offsetR: offsetX4Right / result.scaleX,
        offsetB: offsetY4Bottom / result.scaleY,
        arrowX: outcome.arrowX,
        arrowY: outcome.arrowY,
        scaleX: result.scaleX,
        scaleY: result.scaleY,
        align: placementInfo,
      };
      props.onPopupAlign?.(ele, placementInfo);
    };

    /** 合帧：同一 tick 内多次触发只对齐一次（rc 的 alignCountRef 协议）。 */
    const triggerAlign = (): void => {
      alignCount.value += 1;
      const id = alignCount.value;
      void Promise.resolve().then(() => {
        if (alignCount.value === id) {
          onAlign();
        }
      });
    };

    // ready 重置：placement 变化、open→false（rc 的两个 resetReady effect）
    watch(
      () => props.placement,
      () => {
        offsetInfo.value = {
          ...offsetInfo.value,
          ready: false,
          align: props.builtinPlacements[props.placement] ?? {},
        };
        flipMemory.value = {};
      },
    );
    watch(mergedOpen, (open) => {
      if (!open) {
        offsetInfo.value = { ...offsetInfo.value, ready: false };
        flipMemory.value = {};
      }
    });

    // re-align：滚动容器滚动 / 窗口 resize（rc useWatch + useResizeObserver）
    watch(
      () => (popupEle.value && !isMobile ? collectScroller(popupEle.value as HTMLElement) : []),
      (scrollers, _prev, onCleanup) => {
        const onScroll = () => {
          // rc：alignPoint + clickToHide 时滚动即关闭；tooltip 不用 alignPoint，
          // dropdown 接入时再补 hideActions 判据。
          if (mergedOpen.value && props.alignPoint) {
            overlay.setOpen(false);
            return;
          }
          triggerAlign();
        };
        for (const scroller of scrollers) {
          scroller.addEventListener('scroll', onScroll, true);
        }
        onCleanup(() => {
          for (const scroller of scrollers) {
            scroller.removeEventListener('scroll', onScroll, true);
          }
        });
      },
      { flush: 'post' },
    );
    if (canUseDom()) {
      window.addEventListener('resize', triggerAlign);
    }

    // placement / mousePos 变化立即对齐（rc useLayoutEffect [mousePos, popupPlacement]）
    watch([() => props.placement, () => overlay.mousePos.value], () => triggerAlign());
    // popupEle 挂上后补一次对齐（supportMotion=false 的简化队列不走 onPrepare）
    watch([popupEle, mergedOpen], () => {
      if (mergedOpen.value && popupEle.value) triggerAlign();
    });

    // ============================ Motion hooks ======================
    // appear/enter 的 prepare ⇒ 先对齐再放行动画（首帧定位先于动画）。
    const motionHooks = {
      onAppearPrepare: (element: Element | null) => {
        if (element instanceof HTMLElement && !popupEle.value) popupEle.value = element;
        onAlign();
      },
      onEnterPrepare: (element: Element | null) => {
        if (element instanceof HTMLElement && !popupEle.value) popupEle.value = element;
        onAlign();
      },
      onVisibleChanged: (visible: boolean) => {
        inMotion.value = false;
        onAlign();
        props.afterOpenChange?.(visible);
      },
    };

    expose({
      forceAlign: () => {
        if (!inMotion.value) {
          onAlign();
        }
      },
      nativeElement: () => targetElement.value,
      popupElement: () => popupEle.value,
    });

    // ============================ Render ============================
    const offsetStyle = computed<Record<string, string | number>>(() => {
      const AUTO = 'auto';
      const info = offsetInfo.value;
      // 未就绪：先甩到屏外（rc useOffsetStyle 的占位）
      if (!info.ready) {
        return { left: '-1000vw', top: '-1000vh', right: AUTO, bottom: AUTO };
      }
      const points = info.align.points ?? '';
      const dynamicInset = (info.align as { dynamicInset?: boolean }).dynamicInset === true;
      // rc useOffsetStyle：dynamicInset 看 **popup 侧** point 的 LR/TB 字符
      const alignRight = dynamicInset && points[0]?.[1] === 'r';
      const alignBottom = dynamicInset && points[0]?.[0] === 'b';
      const style: Record<string, string | number> = {};
      if (alignRight) {
        style.right = `${info.offsetR}px`;
        style.left = AUTO;
      } else {
        style.left = `${info.offsetX}px`;
        style.right = AUTO;
      }
      if (alignBottom) {
        style.bottom = `${info.offsetB}px`;
        style.top = AUTO;
      } else {
        style.top = `${info.offsetY}px`;
        style.bottom = AUTO;
      }
      return style;
    });

    const alignedClassName = computed(() =>
      getAlignPopupClassName(
        props.builtinPlacements,
        props.prefixCls,
        offsetInfo.value.align,
        false,
      ),
    );

    /** 箭头内联定位（rc Popup/Arrow.js 的 autoArrow 分支）。 */
    const arrowStyle = computed<Record<string, string | number>>(() => {
      const info = offsetInfo.value;
      const style: Record<string, string | number> = { position: 'absolute' };
      const points = info.align.points;
      if (!points) return style;
      // points = [popupPoint('bl' 这类两字符), targetPoint] —— Arrow.js 的拆法
      const popupTB = points[0][0] ?? '';
      const popupLR = points[0][1] ?? '';
      const targetTB = points[1][0] ?? '';
      const targetLR = points[1][1] ?? '';
      if (popupTB === targetTB || !['t', 'b'].includes(popupTB)) {
        style.top = `${info.arrowY}px`;
      } else if (popupTB === 't') {
        style.top = 0;
      } else {
        style.bottom = 0;
      }
      if (popupLR === targetLR || !['l', 'r'].includes(popupLR)) {
        style.left = `${info.arrowX}px`;
      } else if (popupLR === 'l') {
        style.left = 0;
      } else {
        style.right = 0;
      }
      return style;
    });

    /** rc PopupContent：`memo(_, next => next.cache)` —— 关闭且非 fresh 时冻结内容。 */
    const contentSource = computed<VNodeChild>(() =>
      typeof props.popup === 'function' ? (props.popup as () => VNodeChild)() : props.popup,
    );
    const lastContent = shallowRef<VNodeChild>(undefined);
    watch(
      contentSource,
      (v) => {
        if (mergedOpen.value || props.fresh) {
          lastContent.value = v;
        }
      },
      // flush: post —— 改 lastContent 不能发生在渲染期（渲染自身依赖 ⇒ 递归更新），
      // 开启期间每次渲染后同步一份；关闭后不再更新 ⇒ 冻结
      { immediate: true, flush: 'post' },
    );
    const renderedContent = computed<VNodeChild>(() =>
      mergedOpen.value || props.fresh ? contentSource.value : lastContent.value,
    );

    const renderPopup = (): VNode => {
      const info = offsetInfo.value;
      const arrow = props.arrow;
      const motionName = props.motion?.motionName;
      return h(
        Portal,
        {
          open: props.forceRender || mergedOpen.value || inMotion.value,
          autoDestroy: props.destroyOnHidden ?? false,
          ...(props.getPopupContainer
            ? {
                getContainer: () => {
                  const tgt = overlay.targetRef.value;
                  return (tgt ? props.getPopupContainer?.(tgt) : undefined) ?? document.body;
                },
              }
            : {}),
        },
        {
          default: () =>
            h(
              CSSMotion,
              {
                visible: mergedOpen.value,
                motionName,
                motionAppear: true,
                motionEnter: true,
                motionLeave: true,
                motionDeadline: props.motion?.motionDeadline ?? 0,
                removeOnLeave: false,
                leavedClassName: `${props.prefixCls}-hidden`,
                forceRender: props.forceRender,
                hooks: motionHooks,
                ...(props.motion?.supportMotion !== undefined
                  ? { supportMotion: props.motion.supportMotion }
                  : {}),
              },
              {
                default: (motion: {
                  className?: string;
                  style?: Record<string, string | number>;
                }) => {
                  return h(
                    'div',
                    {
                      ref: popupEle as never,
                      class: [
                        props.prefixCls,
                        motion.className,
                        ...(props.popupClassName
                          ? Array.isArray(props.popupClassName)
                            ? props.popupClassName
                            : [props.popupClassName]
                          : []),
                        !isMobile && alignedClassName.value,
                      ],
                      style: {
                        '--arrow-x': `${info.arrowX || 0}px`,
                        '--arrow-y': `${info.arrowY || 0}px`,
                        ...offsetStyle.value,
                        // rc 的 stretchStyle：'minWidth' ⇒ 浮层不窄于目标
                        ...(props.stretch === 'minWidth' && stretchMinWidth.value
                          ? { minWidth: stretchMinWidth.value }
                          : {}),
                        // rc miscStyle：关闭时指针穿透（离场动画期间仍占位）
                        ...(mergedOpen.value ? {} : { pointerEvents: 'none' }),
                        boxSizing: 'border-box',
                        zIndex: props.zIndex,
                        ...props.popupStyle,
                        ...(motion.style ?? {}),
                      },
                      ...overlay.popupProps.value,
                    },
                    [
                      arrow
                        ? h(
                            'div',
                            {
                              class: [`${props.prefixCls}-arrow`, arrow.className],
                              style: { ...arrowStyle.value, ...(arrow.style ?? {}) },
                            },
                            arrow.content ?? undefined,
                          )
                        : null,
                      renderedContent.value,
                    ],
                  );
                },
              },
            ),
        },
      );
    };

    return () => {
      // 触发元素：default slot 的首个 vnode；非元素 / fragment 包一层 span（rc 同款）。
      const children = slots.default?.();
      const first = Array.isArray(children) ? children[0] : children;
      const child =
        first && typeof first === 'object' && 'type' in first
          ? (first as VNode)
          : h(
              'span',
              [first as VNodeChild].filter((c) => c !== null && c !== undefined),
            );

      const triggerNode = cloneVNode(
        child,
        {
          ...attrs,
          ...overlay.targetProps.value,
          ref: overlay.targetRef as never,
        },
        // mergeRef=true：child 自己的 ref 与 targetRef 合并（rc 的 useComposeRef）
        true,
      );

      // rc 返回 Fragment [triggerNode, Popup] —— Vue 用数组同构，不包多余节点
      return [triggerNode, renderPopup()] as unknown as VNode;
    };
  },
});

export default Trigger;
