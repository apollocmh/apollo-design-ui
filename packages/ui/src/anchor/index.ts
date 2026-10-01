/**
 * Anchor 的公共导出。
 *
 * 与 antd 的 es/anchor/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import AnchorComponent from './Anchor.vue';

/** Anchor 组件。注册名 `AAnchor`（COMPONENT-RULES.md 规则 R2）。 */
export const Anchor = withInstall(AnchorComponent);

export default Anchor;

// TODO(G2): export type { AnchorProps, AnchorRef, ... } from './interface';
// TODO(G4): export { genAnchorStyle } from './style';
// TODO(G4): export type { ComponentToken as AnchorComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareAnchorComponentToken } from './style/token';
