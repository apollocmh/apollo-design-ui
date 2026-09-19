/**
 * Space 的公共导出。
 *
 * 与 antd 的 `es/space/index.js` 对齐的对外面：
 *   - 默认导出 `Space`，并挂 `Space.Compact` / `Space.Addon` 静态别名
 *   - 全部类型（`SpaceProps` / `SpaceRef` / `SpaceSize` / 语义化类型 / `SpaceConfig`）
 *   - **跨组件协议**：`useCompactItemContext` / `NoCompactStyle` /
 *     `SpaceCompactItemContextType` —— 它们被 10 个下游组件消费，
 *     是本组件最重要的导出（见 `./Compact.ts` 的文件头）
 *
 * ── 两处与 antd 的**结构**差异 ─────────────────────────────────────────────────
 *
 *   1. antd 只导出 `Space`，`Compact` / `Addon` 通过静态属性访问。
 *      我们**额外**导出 `SpaceCompact` / `SpaceAddon` —— Vue 的模板里没有
 *      `<Space.Compact>` 这种写法，具名导出是唯一能直接在模板里用的形态。
 *      静态别名**同时保留**（render 函数 / JSX 用户可以用 `Space.Compact`）。
 *   2. `Orientation` **不从这里导出**：antd 也是从 `_util/hooks` 导出它而不是从
 *      `space`；而我们的 barrel 已经从 `./divider` 导出了同名类型，
 *      再导一次会冲突（见 `interface.ts` 的文件头，差异 D35）。
 */

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
// 跨组件协议（下游 10 个组件消费）
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
