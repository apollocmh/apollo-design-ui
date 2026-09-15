/**
 * `@apollo-design/position` —— 浮层定位几何。
 *
 * 边界（刻意划得很窄）：
 *   ✅ 对齐点计算、翻转、平移、箭头位置、可见区裁剪、placement 配置生成
 *   ❌ 触发时机 / 延迟 / 关闭行为 / 层级栈 —— 在 `@apollo-design/overlay`
 *   ❌ DOM 测量（getBoundingClientRect / collectScroller）—— 由 overlay 完成后以 Rect 传入
 *   ❌ 任何 Vue 依赖 —— 本包是纯函数，可脱离组件测试
 *
 * 这样做的原因：AR1（浮层定位）是全项目最大的架构风险。把它压缩成纯函数后，
 * 风险可以在 jsdom 里用生成式用例 + 参考实现差分来验证，
 * 而不必先实现整个 trigger 的生命周期。
 */

export type { AlignOutcome } from './align';

export { alignPopup, toAlignResult } from './align';
export { clipArea, getIntersectionArea, rectToArea } from './area';
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
