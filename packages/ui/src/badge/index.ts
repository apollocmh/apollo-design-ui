/**
 * Badge 的公共导出。
 *
 * 与 antd 的 es/badge/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import BadgeComponent from './Badge.vue';

/** Badge 组件。注册名 `ABadge`（COMPONENT-RULES.md 规则 R2）。 */
export const Badge = withInstall(BadgeComponent);

export default Badge;

// TODO(G2): export type { BadgeProps, BadgeRef, ... } from './interface';
// TODO(G4): export { genBadgeStyle } from './style';
// TODO(G4): export type { ComponentToken as BadgeComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareBadgeComponentToken } from './style/token';
