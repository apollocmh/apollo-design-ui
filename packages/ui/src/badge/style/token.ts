/** Nine existing Badge tokens. Defaults remain static CSS fallbacks; current aliases
 * and theme.components.Badge overrides are consumed by useBadgeTheme.
 */

import type { AliasToken } from '@apollo-design/theme';

/** antd 的 `Math.round(fontSize * lineHeight) - 2 * lineWidth`（默认 seed 代入 = 20）。 */
export const INDICATOR_HEIGHT = 20;
/** antd 的 `fontSize`（= 14）。 */
export const INDICATOR_HEIGHT_SM = 14;
/** antd 的 `fontSizeSM / 2`（= 6）。 */
export const DOT_SIZE = 6;
/** antd 的 `fontSizeSM`（= 12）。 */
export const TEXT_FONT_SIZE = 12;
/** antd 的 `fontSizeSM`（= 12）。 */
export const TEXT_FONT_SIZE_SM = 12;
/** antd 的 `\'normal\'`。 */
export const TEXT_FONT_WEIGHT = 'normal';
/** antd 的 `fontSizeSM / 2`（= 6）。 */
export const STATUS_SIZE = 6;
/** antd 的 `paddingXS`（= 8）。 */
export const PADDING_INLINE = 8;

/** Badge 的 Component Token 类型（与 antd 的 `ComponentToken` 同构）。 */
export interface ComponentToken {
  /** 指示器的 z-index。 */
  indicatorZIndex?: string | number;
  /** 指示器（count）高度。 */
  indicatorHeight?: number;
  /** 小尺寸指示器高度。 */
  indicatorHeightSM?: number;
  /** 小红点尺寸。 */
  dotSize?: number;
  /** 计数字号。 */
  textFontSize?: number;
  /** 小尺寸计数字号。 */
  textFontSizeSM?: number;
  /** 计数字重。 */
  textFontWeight?: string | number;
  /** 状态点尺寸。 */
  statusSize?: number;
  /** 多字符 count 的水平内边距。 */
  paddingInline?: number;
}

/** 与 antd 的 `prepareComponentToken` 逐字对应（默认值以 CSS 变量声明落地）。 */
export const prepareComponentToken = (token?: AliasToken): Required<ComponentToken> => ({
  indicatorZIndex: 'auto',
  indicatorHeight: token
    ? Math.max(0, Math.round(token.fontSize * token.lineHeight) - 2 * token.lineWidth)
    : INDICATOR_HEIGHT,
  indicatorHeightSM: token?.fontSize ?? INDICATOR_HEIGHT_SM,
  dotSize: token ? token.fontSizeSM / 2 : DOT_SIZE,
  textFontSize: token?.fontSizeSM ?? TEXT_FONT_SIZE,
  textFontSizeSM: token?.fontSizeSM ?? TEXT_FONT_SIZE_SM,
  textFontWeight: TEXT_FONT_WEIGHT,
  statusSize: token ? token.fontSizeSM / 2 : STATUS_SIZE,
  paddingInline: token?.paddingXS ?? PADDING_INLINE,
});

/** token 名 → 组件级 CSS 变量名。 */
export const token2Var = (token: string, prefix = 'apollo'): string =>
  `var(--${prefix}-badge-${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)})`;
