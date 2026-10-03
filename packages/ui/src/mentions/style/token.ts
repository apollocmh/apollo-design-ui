/**
 * Mentions 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 `es/mentions/style/index.js` 的
 * `prepareComponentToken = token => ({...initComponentToken(token), dropdownHeight, controlItemWidth,
 * zIndexPopup, itemPaddingVertical})`，其中 `initComponentToken` 来自 `es/input/style/token.js`。
 *
 * ── 为什么这里**重抄**一遍 input 的算式，而不是 import `input/style/token.ts` ──────
 *
 * antd 上游就是「每个输入族组件各调一次 `initComponentToken`，产物逐组件展开」
 * （`input/style/token.js` 是共享源码，但每个组件的 CSS 里都有一份自己的
 * `--ant-<component>-padding-block` 声明）。本仓 `input/style/token.ts` 的文件头已写明
 * 同一约定（「本仓按组件隔离同构复刻，不做跨组件 import」）—— 这里遵守它。
 *
 * ── 双轨制（input / input-number 范本）────────────────────────────────────────
 *
 * - **别名派生**（addonBg / activeBorderColor / hoverBorderColor / hoverBg / activeBg）：
 *   声明落 `var(--apollo-*)`，随主题自适应。
 * - **构建期解析值**（padding 系算式、activeShadow 模板串、lineWidthFocus 条件式）：
 *   静态 CSS 没有运行时 `mergeToken`，构建期算成常量。
 *
 * ── 实测对拍（`node tests/visual/debug/extract-mentions-css.mjs`）───────────────
 *
 * 22 条声明逐条一致：
 * `line-width-focus:1px` `padding-block:4px` `padding-block-sm:0px` `padding-block-lg:7px`
 * `padding-inline:11px` `padding-inline-sm:7px` `padding-inline-lg:11px`
 * `addon-bg:rgba(0,0,0,0.02)` `active-border-color:#1677ff` `hover-border-color:#4096ff`
 * `active-shadow:0 0 0 2px rgba(5,145,255,0.1)` `error-active-shadow:…(255,38,5,0.06)`
 * `warning-active-shadow:…(255,215,5,0.1)` `hover-bg:#ffffff` `active-bg:#ffffff`
 * `input-font-size:14px` `input-font-size-lg:16px` `input-font-size-sm:14px`
 * `dropdown-height:250px` `control-item-width:100px` `z-index-popup:1050`
 * `item-padding-vertical:5px`
 *
 * ⚠️ `initInputToken` 的 `inputAffixPadding` **不在**声明块里 —— antd 是在
 *    `genStyleHooks` 的 style 函数里用 `mergeToken` 注入的（不进 component token），
 *    且 mentions 的规则一条都不引用它 ⇒ 本组件不需要它。
 *
 * ⚠️ registry 的 `tokenCount = 3` 只数 `prepareComponentToken` 里**新增**的 3 个
 *    （`dropdownHeight` / `controlItemWidth` / `zIndexPopup`）；`itemPaddingVertical`
 *    是算式派生（不可被用户覆盖），`initComponentToken` 的 18 项是继承面。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

const px = (value: number | string): string => (typeof value === 'number' ? `${value}px` : value);

/** `initComponentToken` + mentions 自有项的完整产物面。 */
export interface ComponentToken {
  /** `lineWidthFocus === 0 ? 0 : lineWidth`。 */
  lineWidthFocus: string;
  /** `max(round((controlHeight - inputFontSize*lineHeight)/2*10)/10 - lineWidth, 0)`。 */
  paddingBlock: string;
  paddingBlockSM: string;
  /** LG 用 `ceil`（上游 round/round/ceil 三个取整各不同）。 */
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
  /** `0 0 0 ${controlOutlineWidth}px ${controlOutline}`。 */
  activeShadow: string;
  errorActiveShadow: string;
  warningActiveShadow: string;
  /** `colorBgContainer`（别名 → var()）。 */
  hoverBg: string;
  /** `colorBgContainer`（别名 → var()）。 */
  activeBg: string;
  /** `inputFontSize ?? fontSize`（本仓 alias 无 inputFontSize 种子键，恒走 fontSize）。 */
  inputFontSize: string;
  inputFontSizeLG: string;
  inputFontSizeSM: string;
  // ---- mentions 自有 ----
  /** `250`（**常量**，非算式）。 */
  dropdownHeight: string;
  /** `100`（**常量**）。 */
  controlItemWidth: string;
  /** `zIndexPopupBase + 50`。 */
  zIndexPopup: string;
  /** `(controlHeight - fontHeight) / 2`（**算式派生，用户不可覆盖**）。 */
  itemPaddingVertical: string;
}

/** `prepareComponentToken` 的入参面（seed + alias 的子集）。 */
export interface MentionsSeedToken {
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
  controlPaddingHorizontal: number;
  controlPaddingHorizontalSM: number;
  controlOutlineWidth: number;
  /** `round(fontSize * lineHeight)`。 */
  fontHeight: number;
  zIndexPopupBase: number;
}

/** 构建期算好全部值（对拍 antd 的 22 条声明）。 */
export function prepareComponentToken(token: MentionsSeedToken): ComponentToken {
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
    dropdownHeight: '250px',
    controlItemWidth: '100px',
    zIndexPopup: String(token.zIndexPopupBase + 50),
    itemPaddingVertical: px((token.controlHeight - token.fontHeight) / 2),
  };
}

let tokenCache: ComponentToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 seed）。 */
export function mentionsTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken() as unknown as MentionsSeedToken);
  }
  return tokenCache;
}
