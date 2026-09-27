/**
 * `Content` —— `@rc-component/dialog@1.10.0` `es/Dialog/Content/index.js`（76 行）的 Vue 版。
 *
 * ```
 * CSSMotion(visible, onVisibleChanged, onAppearPrepare=onPrepare, onEnterPrepare=onPrepare,
 *           forceRender, motionName, removeOnLeave=destroyOnHidden)
 *   └─ Panel(style={{...motion, ...style, transformOrigin}}, class="{className} {motion}")
 * ```
 *
 * 关键判据：
 *   1. **`transformOrigin`**：`mousePosition` 有值（x 或 y 非 0）时按
 *      `mousePosition - offset(panel)` 算，否则 `''`；只在 appear/enter 的 **prepare** 步算；
 *   2. `removeOnLeave = destroyOnHidden`（关了就真卸载面板）；
 *   3. `forceRender` 透传（没开也渲染）。
 *
 * ⚠️ 与上游的两处**平台差异**（都因为 Vue 的副作用顺序与 CSSMotion 的接口形态）：
 *   - 上游用 `dialogRef.current.nativeElement` 拿动效元素；本仓的 CSSMotion **不暴露**
 *     命令式句柄，而该元素就是 Panel 的根 div ⇒ 直接读 ref-context 里的 `panel`（同一个元素）；
 *   - 上游靠 React 的**子先父后**副作用顺序，让 Dialog 能读到 CSSMotion 的
 *     `inMotion()` / `enableMotion()`；Vue 是**父先子后**，所以这里在 `visible` 变假时
 *     主动回调 `onLeaveStart`，让 Dialog 知道「离场已经启动，别兜底抢跑」。
 */
import { CSSMotion } from '@apollo-design/motion';
import { defineComponent, h, inject, type PropType, ref, type VNodeChild, watch } from 'vue';

import type { ModalSemanticType } from '../interface';
import { dialogRefContextKey } from './context';
import Panel from './Panel';
import { clsx, offset } from './util';

export default defineComponent({
  name: 'ADialogContent',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    className: { type: String, default: undefined },
    visible: { type: Boolean, default: false },
    forceRender: { type: Boolean, default: false },
    destroyOnHidden: { type: Boolean, default: false },
    motionName: { type: String, default: undefined },
    ariaId: { type: String, default: undefined },
    mousePosition: {
      type: Object as PropType<{ x: number; y: number } | null>,
      default: undefined,
    },
    onVisibleChanged: {
      type: Function as PropType<(visible: boolean) => void>,
      default: undefined,
    },
    /** 离场动效启动时回调（见文件头的平台差异说明）。 */
    onLeaveStart: { type: Function as PropType<() => void>, default: undefined },
    // 面板侧透传
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    footer: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    closable: { type: [Boolean, Object] as PropType<unknown>, default: true },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    closeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    onClose: { type: Function as PropType<(e: Event) => void>, default: undefined },
    bodyStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    bodyProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    modalRender: {
      type: Function as PropType<(node: VNodeChild) => VNodeChild>,
      default: undefined,
    },
    width: { type: [String, Number] as PropType<string | number>, default: undefined },
    height: { type: [String, Number] as PropType<string | number>, default: undefined },
    classNames: { type: Object as PropType<ModalSemanticType['classNames']>, default: undefined },
    styles: { type: Object as PropType<ModalSemanticType['styles']>, default: undefined },
    isFixedPos: { type: Boolean, default: false },
    focusTrap: { type: Boolean, default: undefined },
    panelRef: { type: [Object, Function] as PropType<unknown>, default: undefined },
  },
  setup(props, { slots }) {
    const refContext = inject(dialogRefContextKey, null);
    const transformOrigin = ref<string | undefined>(undefined);

    /** appear/enter 的 prepare 步：按鼠标位置算 zoom 的原点。 */
    const onPrepare = (): void => {
      const panel = refContext?.panel?.value;
      if (!panel) return;

      const elementOffset = offset(panel);
      const mousePosition = props.mousePosition;
      transformOrigin.value =
        mousePosition && (mousePosition.x || mousePosition.y)
          ? `${mousePosition.x - elementOffset.left}px ${mousePosition.y - elementOffset.top}px`
          : '';
    };

    // 离场启动的通知（Vue 的父先子后顺序，见文件头）
    watch(
      () => props.visible,
      (visible) => {
        if (!visible) props.onLeaveStart?.();
      },
    );

    const motionHooks = {
      onAppearPrepare: onPrepare,
      onEnterPrepare: onPrepare,
      onVisibleChanged: (visible: boolean) => props.onVisibleChanged?.(visible),
    };

    return () => {
      const contentStyle: Record<string, unknown> = {};
      if (transformOrigin.value) contentStyle.transformOrigin = transformOrigin.value;

      return h(
        CSSMotion,
        {
          visible: props.visible,
          forceRender: props.forceRender,
          motionName: props.motionName,
          removeOnLeave: props.destroyOnHidden,
          /**
           * ⚠️ **上游没有这一项**（rc-dialog 的 Content 不传 deadline）。
           *    本仓加上是因为：`motionName` 有值但**样式表没加载**时（jsdom / 内联渲染
           *    的 L4 用例），CSS 事件永远不来 ⇒ 状态机卡在 active，`afterClose` 不触发。
           *    有 deadline 时行为完全一致（事件先到就清掉定时器），只是多了兜底。
           *    同 drawer 的 `MOTION_CONFIG.motionDeadline = 500`（既有先例）。
           */
          motionDeadline: 500,
          hooks: motionHooks,
        },
        {
          default: (motion: { className?: string; style?: Record<string, unknown> | null }) =>
            h(
              Panel,
              {
                prefixCls: props.prefixCls,
                title: props.title,
                ariaId: props.ariaId,
                footer: props.footer,
                closable: props.closable as never,
                closeIcon: props.closeIcon,
                onClose: props.onClose,
                bodyStyle: props.bodyStyle,
                bodyProps: props.bodyProps,
                modalRender: props.modalRender,
                visible: props.visible,
                forceRender: props.forceRender,
                width: props.width,
                height: props.height,
                classNames: props.classNames,
                styles: props.styles,
                isFixedPos: props.isFixedPos,
                focusTrap: props.focusTrap,
                panelRef: props.panelRef,
                style: { ...(motion.style ?? {}), ...props.style, ...contentStyle },
                className: clsx(props.className, motion.className),
              } as never,
              { default: () => slots.default?.() },
            ),
        },
      );
    };
  },
});
