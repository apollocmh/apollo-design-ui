/** Public Space components, install names, static aliases and cross-component protocols. */
import { withInstall } from '../_internal/with-install';
import AddonComponent from './Addon.vue';
import CompactComponent from './Compact.vue';
import SpaceComponent from './Space.vue';

/** `Space.Compact`。注册名 `ASpaceCompact`。 */
export const SpaceCompact = withInstall(CompactComponent);

/** `Space.Addon`。注册名 `ASpaceAddon`。 */
export const SpaceAddon = withInstall(AddonComponent);

/**
 * `Space`。注册名 `ASpace`。
 *
 * ⚠️ `Object.assign` 而不是「先声明再赋值」：`Object.assign` 的返回值类型是
 *    交叉类型，于是 `Space.Compact` 在类型层可见（`Space.Compact = …` 这种
 *    裸赋值不会更新 `Space` 的类型，下游用 `Space.Compact` 会报 TS2339）。
 */
export const Space = Object.assign(withInstall(SpaceComponent), {
  Compact: SpaceCompact,
  Addon: SpaceAddon,
});

export default Space;

// ---------------------------------------------------------------------------
// 跨组件协议（实际控件消费）
// ---------------------------------------------------------------------------
export {
  CompactItem,
  type CompactItemContext,
  NoCompactStyle,
  spaceCompactItemContextKey,
  useCompactItemContext,
} from './Compact';
export { type SpaceContextType, spaceContextKey, useSpaceContext } from './context';
// ---------------------------------------------------------------------------
// 叶子能力（下游组件与 form 侧会复用）
// ---------------------------------------------------------------------------
export { isPresetSize, isValidGapNumber } from './gapSize';
// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------
export type {
  SpaceAddonProps,
  SpaceAddonRef,
  SpaceAlign,
  SpaceCompactItemContextType,
  SpaceCompactProps,
  SpaceCompactRef,
  SpaceConfig,
  SpaceProps,
  SpaceRef,
  SpaceSemanticAllType,
  SpaceSemanticClassNames,
  SpaceSemanticStyles,
  SpaceSemanticType,
  SpaceSemanticValue,
  SpaceSize,
  SpaceSlot,
} from './interface';
export { getStatusClassNames, type InputStatus } from './statusUtils';
// ---------------------------------------------------------------------------
// 样式
// ---------------------------------------------------------------------------
export { genSpaceStyle } from './style';
export type { ComponentToken as SpaceComponentToken } from './style/token';
export { prepareComponentToken as prepareSpaceComponentToken } from './style/token';
export { isValidOrientation, useOrientation } from './useOrientation';
