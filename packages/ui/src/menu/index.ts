/**
 * Menu 的公共导出。
 *
 * 与 antd 的 es/menu/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import MenuComponent from './Menu.vue';

/** Menu 组件。注册名 `AMenu`（COMPONENT-RULES.md 规则 R2）。 */
export const Menu = withInstall(MenuComponent);

export default Menu;

// TODO(G2): export type { MenuProps, MenuRef, ... } from './interface';
// TODO(G4): export { genMenuStyle } from './style';
// TODO(G4): export type { ComponentToken as MenuComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareMenuComponentToken } from './style/token';
