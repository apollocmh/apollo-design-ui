/**
 * Flex 的公共导出。
 *
 * 与 antd 的 es/flex/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import FlexComponent from './Flex.vue';

/** Flex 组件。注册名 `AFlex`（COMPONENT-RULES.md 规则 R2）。 */
export const Flex = withInstall(FlexComponent);

export default Flex;

// TODO(G2): export type { FlexProps, FlexRef, ... } from './interface';
// TODO(G4): export { genFlexStyle } from './style';
// TODO(G4): export type { ComponentToken as FlexComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareFlexComponentToken } from './style/token';
