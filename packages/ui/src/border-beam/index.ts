/**
 * BorderBeam 的公共导出。
 *
 * 与 antd 的 es/border-beam/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import BorderBeamComponent from './BorderBeam.vue';

/** BorderBeam 组件。注册名 `ABorderBeam`（COMPONENT-RULES.md 规则 R2）。 */
export const BorderBeam = withInstall(BorderBeamComponent);

export default BorderBeam;

// TODO(G2): export type { BorderBeamProps, BorderBeamRef, ... } from './interface';
// TODO(G4): export { genBorderBeamStyle } from './style';
// TODO(G4): export type { ComponentToken as BorderBeamComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareBorderBeamComponentToken } from './style/token';
