/**
 * Badge 的公共导出（Badge + Badge.Ribbon 复合组件）。
 *
 * 与 antd 的 `es/badge/index.js` 对齐：Badge 本体 + `Badge.Ribbon` 属性
 * （antd 的 `CompoundedComponent` —— `Badge.Ribbon` 是 antd 官方的用法，
 * 独立的 `Ribbon` 命名导出一并给出）。
 */

import { withInstall } from '../_internal/with-install';
import BadgeComponent from './Badge.vue';
import RibbonComponent from './Ribbon.vue';

/** Badge 组件。注册名 `ABadge`（COMPONENT-RULES.md 规则 R2）。 */
export const Badge = withInstall(BadgeComponent);

/** Ribbon 组件。注册名 `ARibbon`；同时挂为 `Badge.Ribbon`（antd 用法）。 */
export const Ribbon = withInstall(RibbonComponent);

Badge.Ribbon = Ribbon;

export default Badge;

export type {
  BadgeProps,
  BadgeRef,
  BadgeSemanticClassNames,
  BadgeSemanticStyles,
  BadgeSlot,
  PresetColorKey as BadgePresetColorKey,
  PresetStatusColorType as BadgePresetStatusColorType,
  RibbonProps,
  RibbonRef,
  RibbonSemanticClassNames,
  RibbonSemanticStyles,
  ScrollNumberProps,
} from './interface';
export { genBadgeStyle } from './style';
export type { ComponentToken as BadgeComponentToken } from './style/token';
export { prepareComponentToken as prepareBadgeComponentToken } from './style/token';
