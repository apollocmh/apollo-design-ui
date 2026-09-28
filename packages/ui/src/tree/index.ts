/**
 * Tree 的公共导出。
 *
 * 与 antd 的 es/tree/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import TreeComponent from './Tree.vue';

/** Tree 组件。注册名 `ATree`（COMPONENT-RULES.md 规则 R2）。 */
export const Tree = withInstall(TreeComponent);

export default Tree;

// TODO(G2): export type { TreeProps, TreeRef, ... } from './interface';
// TODO(G4): export { genTreeStyle } from './style';
// TODO(G4): export type { ComponentToken as TreeComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareTreeComponentToken } from './style/token';
