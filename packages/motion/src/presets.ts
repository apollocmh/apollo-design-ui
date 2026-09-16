/**
 * 五类语义中**唯一需要 handler 的那一类**：collapse。
 *
 * ## 为什么只有 collapse 在这里
 *
 * `motion-contract.md` §3.5：fade / zoom / slide / move 四类靠
 * `motionName` + CSS keyframes 就够了，`CSSMotion` 不需要任何 handler；
 * **只有 collapse 需要 `onXxxStart/Active/End`**，因为它的高度是运行期测量的
 * （`0 ↔ scrollHeight`），CSS 自己不知道目标值。
 *
 * 而 §4 的边界写明本包「不产出任何 CSS / keyframes、不定义具体组件的动效参数」——
 * 所以那四类的 keyframes 与 `motionName` 由 `theme` / `ui` 负责，本文件不收。
 *
 * @see `components/_util/motion.ts:10-41`（antd 6.6.4）
 */

import { isTransitionEvent } from '@apollo-design/utils';

import type { MotionEndHandler, MotionStepHandler } from './driver';

// ---------------------------------------------------------------------------
// 三个高度 handler
// ---------------------------------------------------------------------------

/**
 * 折叠态：`{ height: 0, opacity: 0 }`。
 * 对应 antd `getCollapsedHeight`（`_util/motion.ts:11-14`）。
 */
export const getCollapsedHeight: MotionStepHandler = () => ({ height: 0, opacity: 0 });

/**
 * 展开态：高度取 `scrollHeight`（**内容**高度，含溢出部分）。
 * 对应 antd `getRealHeight`（`_util/motion.ts:16-19`）。
 *
 * ⚠️ `scrollHeight` 是 `HTMLElement` 的属性，`Element` 上没有。antd 的参数类型是
 *    React 的 `HTMLElement`，所以能直接 `node?.scrollHeight`；我们的 handler 参数是
 *    更宽的 `Element | null`，这里用 `instanceof` 窄化 —— 对 `SVGElement` 之类的
 *    非 HTML 元素返回 0，与 antd 的 `?? 0` 结论一致（那些元素上取到 `undefined`）。
 */
export const getRealHeight: MotionStepHandler = (element) => ({
  height: element instanceof HTMLElement ? element.scrollHeight : 0,
  opacity: element ? 1 : 0,
});

/**
 * 当前高度：取 `offsetHeight`（**布局**高度，不含溢出）。
 * 离场时用它当起点，因为此时元素已经展开，`offsetHeight` 才是它实际占的高度。
 * 对应 antd `getCurrentHeight`（`_util/motion.ts:21-23`）。
 */
export const getCurrentHeight: MotionStepHandler = (element) => ({
  height: element instanceof HTMLElement ? element.offsetHeight : 0,
});

// ---------------------------------------------------------------------------
// 结束判定
// ---------------------------------------------------------------------------

/**
 * ⭐ **只认 height 的 transitionend**（`_util/motion.ts:25-27`）。
 *
 * collapse 同时过渡 `height` 与 `opacity`，而 `opacity` 通常先结束 —— 若认它，
 * 动画会在高度还没跑完时就被判定结束、元素被摘掉或清掉内联高度，看起来就是
 * 「闪一下」。所以这里要求：
 *
 * - `event.deadline === true`（`motionDeadline` 兜底触发），**或**
 * - 是 transition 事件且 `propertyName === 'height'`
 *
 * `isTransitionEvent` 复用 `@apollo-design/utils`（T2）—— 它的「数组也算对象」
 * 语义是刻意保留的 antd quirk，不要换成本包的严格版本。
 */
export const skipOpacityTransition: MotionEndHandler = (_element, event) =>
  event?.deadline === true ||
  // `event !== undefined` 这个判断在 antd 里是隐式的：`isTransitionEvent(undefined)`
  // 走 `isPlainObject` 返回 false。这里显式写出来是为了让 TS 能窄化 `propertyName`，
  // 行为与上游逐位一致。
  (event !== undefined && isTransitionEvent(event) && event.propertyName === 'height');

// ---------------------------------------------------------------------------
// 预设
// ---------------------------------------------------------------------------

/** `initCollapseMotion()` 的产物。 */
export interface CollapseMotionPreset {
  /** 默认 `apollo-motion-collapse`；ConfigProvider 改前缀时由调用方传入 */
  motionName: string;
  onAppearStart: MotionStepHandler;
  onEnterStart: MotionStepHandler;
  onAppearActive: MotionStepHandler;
  onEnterActive: MotionStepHandler;
  onLeaveStart: MotionStepHandler;
  onLeaveActive: MotionStepHandler;
  onAppearEnd: MotionEndHandler;
  onEnterEnd: MotionEndHandler;
  onLeaveEnd: MotionEndHandler;
  /** 兜底时长（ms）。antd 是 500，CSS 侧也是 0.2s，留足余量给慢机器 */
  motionDeadline: number;
}

/**
 * collapse 预设（`_util/motion.ts:29-41`）。
 *
 * @param rootCls 类名前缀。默认 `apollo`（`prefix-cls-default` 裁决 = A）；
 *   与 antd 的 `defaultPrefixCls` 对应，由 ConfigProvider 覆盖。
 */
export function initCollapseMotion(rootCls = 'apollo'): CollapseMotionPreset {
  return {
    motionName: `${rootCls}-motion-collapse`,
    onAppearStart: getCollapsedHeight,
    onEnterStart: getCollapsedHeight,
    onAppearActive: getRealHeight,
    onEnterActive: getRealHeight,
    onLeaveStart: getCurrentHeight,
    onLeaveActive: getCollapsedHeight,
    onAppearEnd: skipOpacityTransition,
    onEnterEnd: skipOpacityTransition,
    onLeaveEnd: skipOpacityTransition,
    motionDeadline: 500,
  };
}
