/**
 * Input 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/input/style/token.js`（`initInputToken` +
 * `initComponentToken`）。registry 数据：input 组 token 数 = 0（gen-registry
 * 未展开继承面；实际 antd ComponentToken 为 17 项 + initInputToken 的
 * inputAffixPadding）。
 *
 * ── 双轨制（divider / collapse / input-number 范本）──────────────────────────
 *
 * - **别名派生**（addonBg / activeBorderColor / hoverBorderColor / hoverBg /
 *   activeBg）：声明落 `var(--apollo-*)`，随主题自适应（B7 可校验）。
 * - **构建期解析值**（padding 系算式、activeShadow 的模板串、lineWidthFocus 的
 *   条件式）：静态 CSS 没有运行时 cssinjs 的 mergeToken，构建期算成常量
 *   （collapse D46/D50 同判）。
 *
 * 注：input 族基础算式（paddingBlock 系 / paddingInline 系 / inputFontSize 系）
 * 与 `input-number/style/token.ts` 的同名实现同式 —— antd 上游就是每个组件
 * 各自调 `initComponentToken`（token.js 共享但产物逐组件展开），本仓按组件
 * 隔离同构复刻，不做跨组件 import（H11）。
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

/** 构建期算好全部值（对拍 antd `initInputToken` + `initComponentToken`）。 */
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
    tokenCache = prepareComponentToken(getDesignToken() as unknown as InputSeedToken);
  }
  return tokenCache;
}
