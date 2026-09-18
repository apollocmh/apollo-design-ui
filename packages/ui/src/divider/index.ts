/**
 * Divider 的公共导出。
 *
 * 与 antd 的 `es/divider/index.js` 对齐的对外面：
 *   - 默认导出 `Divider`
 *   - 全部类型（`DividerProps` / `DividerRef` / `Orientation` / `TitlePlacement` /
 *     语义化类型 / `DividerConfig`）
 *
 * Divider 没有子组件、没有静态方法 —— 所以这里没有 `Button.Group` 那类别名。
 */

import { withInstall } from '../_internal/with-install';
import DividerComponent from './Divider.vue';

/** Divider 组件。注册名 `ADivider`（`COMPONENT-RULES.md` 规则 R2）。 */
export const Divider = withInstall(DividerComponent);

export default Divider;

export type {
  DividerConfig,
  DividerProps,
  DividerRef,
  DividerSemanticAllType,
  DividerSemanticClassNames,
  DividerSemanticStyles,
  DividerSemanticType,
  DividerSemanticValue,
  DividerSize,
  DividerSlot,
  DividerVariant,
  Orientation,
  TitlePlacement,
} from './interface';
export { genDividerStyle } from './style';
export type { ComponentToken as DividerComponentToken } from './style/token';
export { prepareComponentToken as prepareDividerComponentToken } from './style/token';
