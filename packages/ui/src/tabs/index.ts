/**
 * Tabs 的公共导出。
 *
 * 与 antd 的 es/tabs/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import TabsComponent from './Tabs.vue';

/** Tabs 组件。注册名 `ATabs`（COMPONENT-RULES.md 规则 R2）。 */
export const Tabs = withInstall(TabsComponent);

export default Tabs;

// TODO(G2): export type { TabsProps, TabsRef, ... } from './interface';
// TODO(G4): export { genTabsStyle } from './style';
// TODO(G4): export type { ComponentToken as TabsComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareTabsComponentToken } from './style/token';
