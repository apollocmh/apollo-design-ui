/**
 * @apollo-design/virtual-list
 *
 * 虚拟滚动。替代 `@rc-component/virtual-list`（事实来源 **1.5.1**，由
 * `@rc-component/select@1.10.1` 的 `^1.2.0` 解析而来）。
 *
 * ⚠️ **与上游的两处有意差异**（详见 `docs/foundation/virtual-list-contract.md` §5）：
 *
 *   1. **不做自绘滚动条 ⇒ 用原生滚动。** 上游的 `ScrollBar` 里写死了
 *      `borderRadius: 99` 与 `rgba(0, 0, 0, 0.5)` —— 那是视觉语义，与本包的 `notDo`
 *      冲突。连带后果：不做滚轮 / 触摸拦截；`showScrollBar` 被接受但不生效；
 *      `scrollTo()` 无参调用是 no-op。
 *   2. **横向不做 `marginLeft` 模拟。** 改用原生横向滚动（设了 `scrollWidth` 时给
 *      Filler 内层显式宽度）。
 *
 * 本文件是纯数据的算法与 Vue 层的组件，边界见契约文档 §4。
 */

export type { ListDiffResult } from './algorithm';

export { findListDiffIndex } from './algorithm';
// ---------------------------------------------------------------------------
// 纯数据侧（可在无 DOM 环境下穷举）
// ---------------------------------------------------------------------------
export { CacheMap, createCacheMap } from './cache';
export type { FillerExposed, FillerProps } from './filler';
// ---------------------------------------------------------------------------
// DOM 侧
// ---------------------------------------------------------------------------
export { Filler } from './filler';
export type { ComputeRangeInput } from './range';
export {
  computeRange,
  isInVirtual,
  keepInHorizontalRange,
  keepInRange,
  shouldUseVirtual,
  sumHeights,
} from './range';
export type {
  ComputeScrollTargetInput,
  ComputeScrollTargetResult,
  NormalizedScrollTarget,
  ScrollArg,
} from './scroll-target';
export {
  computeScrollTarget,
  MAX_SCROLL_TO_TIMES,
  normalizeScrollArg,
  resolveScrollOffset,
} from './scroll-target';
export type { CreateSizeGetterInput } from './size';
export { createSizeGetter } from './size';
// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------
export type {
  ExtraRenderInfo,
  GetKey,
  GetSize,
  HeightsLookup,
  ItemKey,
  RangeResult,
  RenderFunc,
  RenderProps,
  ScrollAlign,
  ScrollConfig,
  ScrollInfo,
  ScrollOffsetInfo,
  ScrollPos,
  ScrollTarget,
  SizeInfo,
} from './types';
export type { UseHeightsReturn } from './use-heights';
export { useHeights } from './use-heights';
export type { ScrollTo, VirtualListExposed } from './virtual-list';
export { VirtualList } from './virtual-list';
