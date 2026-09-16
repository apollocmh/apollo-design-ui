/**
 * `@apollo-design/position` —— 浮层定位几何 **与尺寸测量**。
 *
 * 边界（刻意划得很窄）：
 *   ✅ 对齐点计算、翻转、平移、箭头位置、可见区裁剪、placement 配置生成
 *   ✅ **DOM 测量** —— 矩形采集、滚动容器逐级裁剪、CSS scale、`getPopupContainer` 坐标系
 *   ❌ 触发时机 / 延迟 / 关闭行为 / 层级栈 —— 在 `@apollo-design/overlay`
 *   ❌ 挂载与 z-index —— 在 `@apollo-design/portal`
 *   ❌ 把数字写回 `style.left/top` —— 在 `@apollo-design/overlay`
 *   ❌ 任何视觉样式与 DOM 结构（只输出数字）
 *   ❌ 任何 Vue 依赖 —— 本包是纯 TS，可脱离组件测试
 *
 * ⚠️ 这里的旧注释曾经写着「DOM 测量由 overlay 完成后以 Rect 传入」—— **那是错的**，
 *    与 `dependencies.json` 的 `purpose`、「`ARCHITECTURE.md` §9.1（「别把 DOM 测量外壳
 *    误派给 overlay」）冲突。已随测量层落地改正（2026-09-17）。
 *    判据：几何需要的是**数字**，而数字怎么来（含 `getPopupContainer` 的坐标系）
 *    本身就是 AR1 风险的一部分 —— 把它推给 overlay 等于把这个风险原样搬走。
 *
 * 这样做的原因：AR1（浮层定位）是全项目最大的架构风险。把它压缩成
 * 「纯函数 + 一次 DOM 问询」之后，风险可以在 jsdom 里用生成式用例 + 参考实现差分验证，
 * 而不必先实现整个 trigger 的生命周期。
 */

export type { AlignOutcome } from './align';
export { alignPopup, toAlignResult } from './align';
export { clipArea, getIntersectionArea, rectToArea } from './area';
export type {
  HtmlRegion,
  MeasureInput,
  MeasureResult,
  MeasureTarget,
  RectLike,
  ScaleResult,
} from './measure';
export {
  collectScroller,
  getScrollArea,
  getViewportArea,
  getVisibleArea,
  getWin,
  measureAlign,
  measureRect,
  measureScale,
  mirrorOffsetB,
  mirrorOffsetR,
  normalizeHtmlRegion,
  pointRect,
  pxValue,
  scaleFloor,
  shouldMeasure,
  toRect,
  toSafeNum,
} from './measure';
export { getNumberOffset, getUnitOffset } from './offset';
export {
  ARROW_CENTER_PLACEMENT_POINTS,
  getArrowOffsetToken,
  getOverflowOptions,
  getPlacements,
  PLACEMENT_POINTS,
} from './placements';
export type { Point } from './point';
export { alignPointOf, flatPoint, getAlignPoint, reversePoint, splitPoints } from './point';
export type {
  AlignContext,
  AlignPoint,
  AlignResult,
  AlignType,
  Area,
  FlipMemory,
  HorizontalPoint,
  OffsetType,
  OverflowConfig,
  Placement,
  PlacementConfig,
  Rect,
  VerticalPoint,
} from './types';
