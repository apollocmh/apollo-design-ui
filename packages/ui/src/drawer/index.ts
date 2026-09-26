/**
 * Drawer 的公共导出。
 *
 * 与 antd 的 es/drawer/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import DrawerComponent from './Drawer.vue';

/** Drawer 组件。注册名 `ADrawer`（COMPONENT-RULES.md 规则 R2）。 */
export const Drawer = withInstall(DrawerComponent);

export default Drawer;

// TODO(G2): export type { DrawerProps, DrawerRef, ... } from './interface';
// TODO(G4): export { genDrawerStyle } from './style';
// TODO(G4): export type { ComponentToken as DrawerComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareDrawerComponentToken } from './style/token';
