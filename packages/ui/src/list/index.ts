/**
 * List 的公共导出。
 *
 * 与 antd 的 es/list/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import ListComponent from './List.vue';

/** List 组件。注册名 `AList`（COMPONENT-RULES.md 规则 R2）。 */
export const List = withInstall(ListComponent);

export default List;

// TODO(G2): export type { ListProps, ListRef, ... } from './interface';
// TODO(G4): export { genListStyle } from './style';
// TODO(G4): export type { ComponentToken as ListComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareListComponentToken } from './style/token';
