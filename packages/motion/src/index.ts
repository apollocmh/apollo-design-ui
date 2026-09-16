/**
 * @apollo-design/motion
 *
 * CSSMotion 等价物：声明式 CSS 过渡/动画控制。替代 @rc-component/motion。
 *
 * 边界（刻意划得很窄）：
 *   ✅ status/step 状态机、class 与内联样式的时间线、结束判定、兜底定时器
 *   ✅ 五类语义（collapse / slide / zoom / fade / move）的**行为**契约
 *   ❌ 不产出任何 CSS / keyframes（那是 theme 与 ui 的事）
 *   ❌ 不依赖 portal / overlay（不关心元素挂在哪个容器）
 *   ❌ 不复用 Vue 的 `<Transition>` —— 见 `docs/foundation/motion-contract.md` §6
 *
 * ⚠️ 为什么不能直接用 `<Transition>`：antd 需要 `motionDeadline`、
 *    `motionLeaveImmediately`、`prepare` 步、以及「动画期间始终挂裸的
 *    `{motionName}`」—— 这四条 Vue 都没有，第三条是 class 语义层面的
 *    根本差异，不是配置能绕过的。
 *
 * 与 AR1 的切法对称：`status.ts` 是**纯函数内核**（可被差分穷举），
 * 帧驱动与 DOM 事件监听是外壳（不属于 PoC 的差分范围，见契约文档 §7）。
 */

// ---- Vue 层 ----
export type { CSSMotionSlotProps } from './css-motion';
export { CSSMotion } from './css-motion';
// ---- 多元素 key diff ----
export type { KeyEntity, KeyObject, MotionKeyStatus } from './diff';
export {
  diffKeys,
  parseKeys,
  STATUS_ADD,
  STATUS_KEEP,
  STATUS_REMOVE,
  STATUS_REMOVED,
  wrapKeyToObject,
} from './diff';
export type {
  MotionDomAdapter,
  MotionDriver,
  MotionDriverOptions,
  MotionEndHandler,
  MotionHooks,
  MotionPrepareHandler,
  MotionScheduler,
  MotionSnapshot,
  MotionStepHandler,
} from './driver';
export { createMotionDriver, defaultDomAdapter, defaultScheduler } from './driver';
export { MotionList } from './motion-list';
export type { NextFrameHandle } from './next-frame';
export { useNextFrame } from './next-frame';
// ---- 预设（五类里唯一需要 handler 的 collapse）----
export type { CollapseMotionPreset } from './presets';
export {
  getCollapsedHeight,
  getCurrentHeight,
  getRealHeight,
  initCollapseMotion,
  skipOpacityTransition,
} from './presets';
export type {
  MotionEndEventLike,
  MotionEndInput,
  MotionStatus,
  MotionStyle,
  PickStatusInput,
  RenderMode,
  StepStatus,
} from './status';
export {
  FULL_STEP_QUEUE,
  getMotionClassName,
  getMotionStyle,
  getStatusSuffix,
  getStyleReady,
  getTransitionName,
  isActiveStep,
  nextStepInQueue,
  pickRenderMode,
  pickStatus,
  SIMPLE_STEP_QUEUE,
  STATUS_APPEAR,
  STATUS_ENTER,
  STATUS_LEAVE,
  STATUS_NONE,
  STEP_ACTIVATED,
  STEP_ACTIVE,
  STEP_NONE,
  STEP_PREPARE,
  STEP_PREPARED,
  STEP_START,
  shouldEndMotion,
  shouldStartMotion,
} from './status';
// ---- 环境探测 ----
export type { MotionSupport } from './support';
export { detectMotionSupport, detectSupportMotion } from './support';
export type { UseMotionStatusOptions, UseMotionStatusReturn } from './use-motion-status';
export { useMotionStatus } from './use-motion-status';
