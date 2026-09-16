/**
 * `CSSMotion` —— `CSSMotion.js` 的 Vue 等价物。
 *
 * ## 与 React 版的三个结构性差异（都是必需的，不是风格选择）
 *
 * 1. **children 是 slot 而不是 render prop**。
 *    React 版是 `children(props, ref)`；Vue 里用作用域 slot（§「slot 契约」）。
 * 2. **handler 走 `hooks` 对象 prop 而不是 12 个独立 prop**。
 *    因为它们的返回值是有意义的（start/active 返回 style、end 返回可否决的布尔），
 *    不能用 `emit`（emit 不返回值）。
 * 3. **元素引用靠 `cloneVNode` 注入**。
 *    React 版用 `cloneElement` + `composeRef`（`CSSMotion.js:147-153`）；
 *    Vue 对应 `cloneVNode`。少了这一步，驱动拿不到 DOM，
 *    事件与测量（`scrollHeight` / `offsetHeight`）全部失效。
 *
 * @see `es/CSSMotion.js:85-155`
 */

import { cloneVNode, defineComponent, type PropType, type VNode } from 'vue';

import type { MotionHooks } from './driver';
import type { MotionStatus, StepStatus } from './status';
import { detectSupportMotion } from './support';
import { useMotionStatus } from './use-motion-status';

export interface CSSMotionSlotProps {
  /** 本帧应挂的 class（含裸的 `{n}`）。动画未开始时为空串 */
  className: string;
  /** 本帧应写的内联样式。`null` 表示不写 */
  style: Record<string, string | number> | null;
  /** 与 props.visible 相同，方便 slot 内部按可见性分支 */
  visible: boolean;
  status: MotionStatus;
  step: StepStatus;
}

export const CSSMotion = defineComponent({
  name: 'CSSMotion',
  inheritAttrs: false,
  props: {
    visible: { type: Boolean, default: false },
    motionName: { type: String, default: undefined },
    motionAppear: { type: Boolean, default: true },
    motionEnter: { type: Boolean, default: true },
    motionLeave: { type: Boolean, default: true },
    motionLeaveImmediately: { type: Boolean, default: false },
    motionDeadline: { type: Number, default: 0 },
    removeOnLeave: { type: Boolean, default: true },
    forceRender: { type: Boolean, default: false },
    leavedClassName: { type: String, default: undefined },
    /** 五个时机 × 三类 handler。见 `MotionHooks` */
    hooks: { type: Object as PropType<MotionHooks>, default: undefined },
    /**
     * 是否支持 CSS 动画。不传则调 `detectSupportMotion()` 探测。
     * ⚠️ 测试里**必须**显式传 `true`：jsdom 的 CSSStyleDeclaration 未必认
     *    `animation` / `transition` 属性，探测结果可能是 false，
     *    那样走的是简队列（`prepare → prepared`），测不到 start/active 时间线。
     */
    supportMotion: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  },
  setup(props, { slots }) {
    const motion = useMotionStatus({
      visible: () => props.visible,
      motionName: () => props.motionName,
      supportMotion: () => props.supportMotion ?? detectSupportMotion(),
      motionAppear: props.motionAppear,
      motionEnter: props.motionEnter,
      motionLeave: props.motionLeave,
      motionLeaveImmediately: props.motionLeaveImmediately,
      motionDeadline: props.motionDeadline,
      removeOnLeave: props.removeOnLeave,
      forceRender: props.forceRender,
      leavedClassName: props.leavedClassName,
      hooks: props.hooks,
    });

    return () => {
      const mode = motion.renderMode.value;

      // 首帧不渲染（支持动画 + 开了 appear）—— 避免未带初始 class 的元素闪一帧
      if (mode === 'null') return null;

      const slotProps: CSSMotionSlotProps = {
        className: motion.className.value,
        style: motion.style.value,
        visible: props.visible,
        status: motion.status.value,
        step: motion.step.value,
      };

      if (mode === 'leaved') {
        // 离场结束但 `removeOnLeave=false`：留一个带 leavedClassName 的残骸
        slotProps.className = props.leavedClassName ?? '';
      }
      if (mode === 'hidden') {
        // forceRender 或「不移除但没给 leavedClassName」：留在 DOM 里隐藏
        slotProps.className = '';
        slotProps.style = { display: 'none' };
      }

      const children = slots.default?.(slotProps);
      const first: VNode | undefined = children?.[0];
      if (!first) return null;

      // ⭐ 把元素引用注入进 slot 的根 vnode —— 驱动靠它拿 DOM。
      //    `ref` 传 Ref 对象时 Vue 会把元素/实例赋给 `.value`。
      return cloneVNode(first, { ref: motion.elementRef });
    };
  },
});
