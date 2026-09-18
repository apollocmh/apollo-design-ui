/**
 * @apollo-design/overlay
 *
 * 锚定浮层的生命周期编排。替代 @rc-component/trigger 的触发时机与生命周期部分。
 * **定位几何在 @apollo-design/position，挂载在 @apollo-design/portal** ——
 * 本包只编排「何时开、何时关、谁在上层」。
 *
 * 契约文档：`docs/foundation/overlay-contract.md`（**先于本实现存在**）。
 *
 * ── 边界提醒 ────────────────────────────────────────────────────────────────
 *
 * - **不做** z-index 数值（归 `portal`，且 antd 的 z-index 是"类型偏移 + 嵌套累加"，
 *   不是"后开在上"的栈 —— 见契约 §3.13）
 * - **不做**定位几何 / 翻转 / 滚动测量（归 `position`）
 * - **不做**焦点陷阱（归 `a11y`）
 * - **不做**滚动锁定与离场动画（归 ui / `motion`）
 * - 本包**唯一的"栈"**是 Esc 栈，它是按开启顺序的 LIFO（契约 §3.11）
 */

// ---------------------------------------------------------------------------
// 动作解析（纯函数）
// ---------------------------------------------------------------------------
export type {
  OverlayAction,
  OverlayActionInput,
  ResolveActionsOptions,
  ResolvedActions,
} from './actions';
export { isClickToHide, resolveActions } from './actions';

// ---------------------------------------------------------------------------
// 延迟（单位是**秒**）
// ---------------------------------------------------------------------------
export type { DelayInvoker, DelayResolution, DelayTimers } from './delay';
export { createDelayInvoker, resolveDelay } from './delay';

// ---------------------------------------------------------------------------
// Esc 层级栈
// ---------------------------------------------------------------------------
export type {
  EscCallbackInfo,
  EscEventLike,
  EscStack,
  EscStackEntry,
  EscStackOptions,
} from './esc-stack';
export { createEscStack, IME_LOCK_DURATION } from './esc-stack';

// ---------------------------------------------------------------------------
// 组合式：生命周期编排本体
// ---------------------------------------------------------------------------
export type {
  MousePosition,
  OverlayEventProps,
  UseOverlayOptions,
  UseOverlayReturn,
} from './use-overlay';
export { getGlobalEscStack, useOverlay } from './use-overlay';

// ---------------------------------------------------------------------------
// 默认导出（次要入口，便于 `import overlay from '@apollo-design/overlay'`）
// ---------------------------------------------------------------------------
import { useOverlay } from './use-overlay';

export default { useOverlay };
