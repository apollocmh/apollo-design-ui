/**
 * Tooltip 的公共导出。
 *
 * 与 antd 的 es/tooltip/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import TooltipComponent from './Tooltip.vue';

/** Tooltip 组件。注册名 `ATooltip`（COMPONENT-RULES.md 规则 R2）。 */
export const Tooltip = withInstall(TooltipComponent);

export default Tooltip;

// TODO(G2): export type { TooltipProps, TooltipRef, ... } from './interface';
// TODO(G4): export { genTooltipStyle } from './style';
// TODO(G4): export type { ComponentToken as TooltipComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareTooltipComponentToken } from './style/token';
