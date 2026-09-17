/**
 * @apollo-design/a11y
 *
 * 运行时无障碍原语。antd 把焦点管理、roving tabindex、live region 等散落在各组件与 rc 包里，
 * 本项目把它们收敛为可复用的原语。零视觉语义，只管「可达性」。
 *
 * ⚠️ **焦点陷阱不在这里实现** —— 它已经在 `@apollo-design/utils`（L0）落地
 * （`getFocusNodeList` / `lockFocus` / `useLockFocus` / `triggerFocus` / `resetFocusLock`），
 * 本包**再导出**以便消费者从一个入口拿全。utils 是 L0、本包是 L1，
 * 反过来搬会构成跨层反向依赖。详见 `docs/foundation/a11y-contract.md` §1.1。
 *
 * 本包自己实现的是 utils 没有的五类：
 *   1. 焦点**恢复**（`focus-restore.ts`）
 *   2. roving tabindex —— 纯算术 + `useRovingFocus`（`roving.ts` / `use-roving-focus.ts`）
 *   3. active-descendant 的 id 方案 + `useActiveDescendant`（`combobox.ts` / `use-active-descendant.ts`）
 *   4. live region —— 纯格式化 + 节点 + `useLiveRegion` / `announce`（`live-region.ts`）
 *   5. typeahead —— 纯匹配 + `useTypeahead`（`combobox.ts` / `use-typeahead.ts`）
 */

// ---------------------------------------------------------------------------
// 再导出：焦点陷阱（实现在 utils，见文件头）
// ---------------------------------------------------------------------------
export type { InputFocusOptions } from '@apollo-design/utils';
export {
  getFocusNodeList,
  lockFocus,
  resetFocusLock,
  triggerFocus,
  useLockFocus,
} from '@apollo-design/utils';
// ---------------------------------------------------------------------------
// combobox：aria id 方案 + typeahead
// ---------------------------------------------------------------------------
export type { TypeaheadState } from './combobox';
export {
  DEFAULT_TYPEAHEAD_RESET_DELAY,
  findTypeaheadIndex,
  getListboxId,
  getOptionId,
  INITIAL_TYPEAHEAD_STATE,
  isTypeaheadKey,
  pushTypeaheadChar,
} from './combobox';
// ---------------------------------------------------------------------------
// 焦点恢复
// ---------------------------------------------------------------------------
export type { FocusRestoreHandle, FocusRestoreOptions } from './focus-restore';
export { useFocusRestore } from './focus-restore';
// ---------------------------------------------------------------------------
// live region
// ---------------------------------------------------------------------------
export type {
  LiveRegionHandle,
  LiveRegionOptions,
  LiveRegionValue,
  UseLiveRegionReturn,
} from './live-region';
export {
  announce,
  announceValues,
  createLiveRegion,
  formatLiveRegionText,
  LIVE_REGION_MAX_COUNT,
  resetAnnounceRegion,
  useLiveRegion,
  VISUALLY_HIDDEN_STYLE,
} from './live-region';
// ---------------------------------------------------------------------------
// roving tabindex
// ---------------------------------------------------------------------------
export type { RovingOrientation } from './roving';
export {
  getRovingOffset,
  getRovingTabIndex,
  moveRovingIndex,
  NO_ACTIVE_INDEX,
  nextRovingIndex,
  resolveRovingEnd,
  resolveRovingHome,
} from './roving';

export type {
  UseActiveDescendantOptions,
  UseActiveDescendantReturn,
} from './use-active-descendant';
export { useActiveDescendant } from './use-active-descendant';
export type { UseRovingFocusOptions, UseRovingFocusReturn } from './use-roving-focus';
export { useRovingFocus } from './use-roving-focus';
export type { UseTypeaheadOptions, UseTypeaheadReturn } from './use-typeahead';
export { useTypeahead } from './use-typeahead';
