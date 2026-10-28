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
import { transformToken, useTheme } from '@apollo-design/theme';
import { canUseDom } from '@apollo-design/utils';
import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
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

/**
 * 目标矩形是否完全落在可视区外。
 *
 * 纯函数以便单测穷举：jsdom 无布局时矩形恒为 0，真实分支只能靠这里钉住。
 * 零尺寸矩形返回 `false`（无法判定 ⇒ 仍然对齐，保持既有 jsdom 行为）。
 */
export function isTargetOutsideArea(
  rect: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  area: { left: number; top: number; right: number; bottom: number },
): boolean {
  if (rect.width <= 0 || rect.height <= 0) return false;
  return (
    rect.right <= area.left ||
    rect.left >= area.right ||
    rect.bottom <= area.top ||
    rect.top >= area.bottom
  );
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
// 触发元素归一（Vue 的 ref 在组件 vnode 上给的是**实例**，契约要的是元素）
// ---------------------------------------------------------------------------

/**
 * 把 Vue 的 ref 回调值归一成 DOM 元素：`null` / 元素 / 组件实例（读 `$el`）。
 *
 * ⚠️ 组件实例的 `$el` 未必是元素（多根组件是文本节点 / Fragment 占位注释）
 * ⇒ 取不到就回落 `null`，与「未绑 ref」同判（rc 的可选链语义）。
 */
function resolveTriggerElement(value: unknown): HTMLElement | null {
  if (!value) return null;
  if (value instanceof HTMLElement) return value;
  const el = (value as { $el?: unknown }).$el;
  return el instanceof HTMLElement ? el : null;
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
      type: Function as PropType<(triggerNode: HTMLElement) => HTMLElement | ShadowRoot | null>,
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
    const theme = useTheme();
    // Native Portal keeps injection, but leaves the Provider's DOM/CSS scope.
    // Apply the current source aliases to the popup itself; local popup styles still win.
    const popupThemeStyle = computed(() =>
      theme.sourceActive?.value !== false ? transformToken(theme.token.value).vars : undefined,
    );
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
    /**
     * ⭐ 浮层元素的**唯一**写入口。
     *
     * `overlay.popupRef` 不是可选的装饰 —— 它是 `@apollo-design/overlay` 契约的一部分，
     * 两处行为依赖它（缺了就是「接线遗漏」，不是"上游也这样"）：
     *   1. **hover 保活**（契约 §3.6）：鼠标从触发元素移进浮层时，浮层的
     *      `onMouseenter` 要排一个开启定时器去顶掉 `onMouseleave` 排的关闭定时器；
     *      判定用的是 `popupRef.value.contains(event.target)` ⇒ 恒 null 就永不保活，
     *      表现为"鼠标一移过去浮层就消失"。
     *   2. **点浮层内不算外部点击**（§3.10）：`inPopupOrChild()` 用它判定，
     *      恒 null 会把浮层内部的点击当成外部点击而关闭（click 型浮层直接失效）。
     *
     * ⚠️ 别改成"只写 popupEle"—— 那正是这个 bug 的成因。
     */
    const setPopupEle = (element: HTMLElement | null): void => {
      popupEle.value = element;
      overlay.popupRef.value = element;
    };
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

    /**
     * ⭐ 触发元素的**唯一**写入口 —— 写入前先归一成 DOM 元素。
     *
     * 🚨 **为什么必须归一**：`overlay.targetRef` 的契约是 `Ref<HTMLElement | null>`
     * （`use-overlay.ts` 头注「绑到触发元素上」）。但 Vue 的 ref 在 **child 是组件
     * vnode** 时给的是**组件实例**（`ComponentPublicInstance`），不是元素 ——
     * `ColorPicker` 的 `ColorTrigger`、`Button` 触发器等**全是这种形态**。
     * 直接存实例的后果（2026-10-16 实测）：
     *   · overlay 的 `inPopupOrChild()` 调 `containsOrIs(target, ele)` ⇒
     *     `host.contains` 不存在 ⇒ **抛 TypeError** ⇒ 外部点击处理器整体崩掉
     *     ⇒ 「点浮层外面不关闭」（ColorPicker / 一切组件触发器的浮层）。
     *   · `getPopupContainer(target)` 拿到的也不是元素。
     *
     * ⚠️ 别把归一逻辑只放在读取侧（本文件的 `targetElement`）：overlay 自己也会
     *    直接读 `targetRef`，那里读到的仍是实例。
     */
    const setTargetEle = (value: unknown): void => {
      overlay.targetRef.value = resolveTriggerElement(value);
    };

    /**
     * 对齐目标：alignPoint 场景用鼠标位置，否则用触发元素。
     *
     * ⚠️ 直接别名即可 —— `setTargetEle` 是唯一写入口且已归一 ⇒ `targetRef` 恒为元素。
     *    （此前这里还做一遍 `$el` 归一是**不够**的：overlay 自己读的是 `targetRef`。）
     */
    const targetElement = overlay.targetRef;

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
      /**
       * 🚨 目标完全在可视区外时**不要对齐**（2026-10-22 Menu 审计 M-06）。
       *
       * 页面刚加载时，下方菜单的 trigger 仍在视口外，但 `isVisible()` 只判
       * display/visibility（不判视口相交）⇒ 会照常对齐；此时 `alignPopup` 判定
       * 「浮层下边超出视口」并写下 `flip.bt`。**翻转记忆是粘滞的**：用户随后
       * 滚动到菜单时，即使位置已经正确，也会保持翻转 ⇒ 弹层永久偏移
       * （实测 140px = 180 - 40，正好是 popup 高度与 title 高度之差）。
       *
       * 修正：视口外不产生任何对齐结果，等滚动进视口后按**无记忆**的初始状态
       * 重新对齐。jsdom 的矩形恒为 0 ⇒ 不触发该分支，既有单测不受影响。
       */
      if (
        tgt instanceof HTMLElement &&
        isTargetOutsideArea(tgt.getBoundingClientRect(), result.visible)
      ) {
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
        /**
         * 🚨 上游 `useWatch.js` 的 `mergedList = new Set([win, ...targetScrollList,
         * ...popupScrollList])` —— **window 本身也是一个滚动源**。
         *
         * 本仓原先只挂了 `collectScroller()` 的产物，而 `html` / `body` 的计算
         * `overflow` 是 `visible` ⇒ 不在列表里 ⇒ 页面整页滚动（文档站最常见的情形）
         * 不会触发重新对齐：弹层停在旧位置（2026-10-22 Menu 审计 M-06 实测，
         * 垂直子菜单在 scrollIntoView 后偏移 140px）。
         */
        const win = popupEle.value?.ownerDocument?.defaultView ?? (canUseDom() ? window : null);
        win?.addEventListener('scroll', onScroll, true);
        onCleanup(() => {
          for (const scroller of scrollers) {
            scroller.removeEventListener('scroll', onScroll, true);
          }
          win?.removeEventListener('scroll', onScroll, true);
        });
      },
      { flush: 'post' },
    );
    // ⚠️ 这是**原生全局监听**，Vue 不会自动清理（只有 `watch` 的 onCleanup 会自动跑）
    //    ⇒ 必须在卸载时显式移除，否则每个已卸载的 Trigger 都会继续响应 window resize
    //    （Trigger 是 tooltip/dropdown/select/cascader/date-picker/tour/mentions 的共享基建，
    //     泄漏按实例累积）。全仓扫描确认这是唯一一处缺移除的 addEventListener。
    if (canUseDom()) {
      window.addEventListener('resize', triggerAlign);
      onBeforeUnmount(() => {
        window.removeEventListener('resize', triggerAlign);
      });
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
        if (element instanceof HTMLElement && !popupEle.value) setPopupEle(element);
        onAlign();
      },
      onEnterPrepare: (element: Element | null) => {
        if (element instanceof HTMLElement && !popupEle.value) setPopupEle(element);
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
      // rc `useOffsetStyle`：`if (!isMobile && (ready || !open))` 才使用 offset。
      // 关闭时必须沿用**最后一次** offset，否则离场动画会在 -1000vw/-1000vh
      // 的屏外位置播放（2026-10-21 阶段 0 实测）。只有「打开但尚未对齐」才占位。
      if (!info.ready && mergedOpen.value) {
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
                      ref: ((el: unknown) => {
                        setPopupEle((el as HTMLElement | null) ?? null);
                      }) as never,
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
                        ...popupThemeStyle.value,
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
          // 🚨 不能写 `ref: overlay.targetRef`：组件 vnode 的 ref 给的是实例，
          //    会让 overlay 的 `inPopupOrChild()` 抛 TypeError ⇒ 外部点击不关闭。
          ref: setTargetEle as never,
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
