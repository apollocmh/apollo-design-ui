/**
 * Input 的 19 个既有 Component Token 与公开数值准备函数。
 * 数值公式保留历史兼容；实际静态 CSS 由当前 Alias 派生，theme.components.Input
 * 的显式值由所属 composable 传给逻辑根。最初参考 antd 6.6.4 的准备算法。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

const px = (value: number | string): string => (typeof value === 'number' ? `${value}px` : value);

/** initInputToken + initComponentToken 的完整产物面。 */
export interface ComponentToken {
  /** `lineWidthFocus === 0 ? 0 : lineWidth`（焦点环与静息环同宽的派生）。 */
  lineWidthFocus: string;
  /** `max(round((controlHeight-inputFontSize*lineHeight)/2*10)/10 - lineWidth, 0)`。 */
  paddingBlock: string;
  paddingBlockSM: string;
  /** LG 用 ceil（上游 round/round/ceil 三个取整各不同）。 */
  paddingBlockLG: string;
  /** `paddingSM - lineWidth`。 */
  paddingInline: string;
  /** `controlPaddingHorizontalSM - lineWidth`。 */
  paddingInlineSM: string;
  /** `controlPaddingHorizontal - lineWidth`。 */
  paddingInlineLG: string;
  /** `colorFillAlter`（别名 → var()）。 */
  addonBg: string;
  /** `colorPrimary`（别名 → var()）。 */
  activeBorderColor: string;
  /** `colorPrimaryHover`（别名 → var()）。 */
  hoverBorderColor: string;
  /** `0 0 0 ${controlOutlineWidth}px ${controlOutline}`（构建期模板串）。 */
  activeShadow: string;
  /** 同 activeShadow，色换 `colorErrorOutline`。 */
  errorActiveShadow: string;
  /** 同 activeShadow，色换 `colorWarningOutline`。 */
  warningActiveShadow: string;
  /** `colorBgContainer`（别名 → var()）。 */
  hoverBg: string;
  /** `colorBgContainer`（别名 → var()）。 */
  activeBg: string;
  /** `inputFontSize ?? fontSize`（本仓 alias 无 inputFontSize 种子键，恒走 fontSize）。 */
  inputFontSize: string;
  inputFontSizeLG: string;
  inputFontSizeSM: string;
  /** initInputToken：`paddingXXS`。 */
  inputAffixPadding: string;
}

/** prepareComponentToken 的入参面（AliasToken 的子集）。 */
export interface InputSeedToken {
  controlHeight: number;
  controlHeightSM: number;
  controlHeightLG: number;
  fontSize: number;
  fontSizeLG: number;
  lineHeight: number;
  lineHeightLG: number;
  lineWidth: number;
  lineWidthFocus: number;
  paddingSM: number;
  paddingXXS: number;
  controlPaddingHorizontal: number;
  controlPaddingHorizontalSM: number;
  controlOutlineWidth: number;
  controlOutline: string;
  colorErrorOutline: string;
  colorWarningOutline: string;
}

/** 根据调用方数值快照准备字段；不决定组件当前 CSS 的主题默认值。 */
export function prepareComponentToken(token: InputSeedToken): ComponentToken {
  const inputFontSize = token.fontSize;
  const inputFontSizeSM = inputFontSize;
  const inputFontSizeLG = token.fontSizeLG;

  const paddingBlock =
    Math.round(((token.controlHeight - inputFontSize * token.lineHeight) / 2) * 10) / 10 -
    token.lineWidth;
  const paddingBlockSM =
    Math.round(((token.controlHeightSM - inputFontSizeSM * token.lineHeight) / 2) * 10) / 10 -
    token.lineWidth;
  const paddingBlockLG =
    Math.ceil(((token.controlHeightLG - inputFontSizeLG * token.lineHeightLG) / 2) * 10) / 10 -
    token.lineWidth;

  const shadow = (outline: string): string => `0 0 0 ${token.controlOutlineWidth}px ${outline}`;

  return {
    lineWidthFocus: px(token.lineWidthFocus === 0 ? 0 : token.lineWidth),
    paddingBlock: px(Math.max(paddingBlock, 0)),
    paddingBlockSM: px(Math.max(paddingBlockSM, 0)),
    paddingBlockLG: px(Math.max(paddingBlockLG, 0)),
    paddingInline: px(token.paddingSM - token.lineWidth),
    paddingInlineSM: px(token.controlPaddingHorizontalSM - token.lineWidth),
    paddingInlineLG: px(token.controlPaddingHorizontal - token.lineWidth),
    addonBg: v('colorFillAlter'),
    activeBorderColor: v('colorPrimary'),
    hoverBorderColor: v('colorPrimaryHover'),
    activeShadow: shadow(v('controlOutline')),
    errorActiveShadow: shadow(v('colorErrorOutline')),
    warningActiveShadow: shadow(v('colorWarningOutline')),
    hoverBg: v('colorBgContainer'),
    activeBg: v('colorBgContainer'),
    inputFontSize: px(inputFontSize),
    inputFontSizeLG: px(inputFontSizeLG),
    inputFontSizeSM: px(inputFontSizeSM),
    inputAffixPadding: px(token.paddingXXS),
  };
}

let tokenCache: ComponentToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 seed）。 */
export function inputTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken());
  }
  return tokenCache;
}
