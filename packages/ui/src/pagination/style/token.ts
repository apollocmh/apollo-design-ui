/**
 * Pagination 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 `es/pagination/style/index.js` 的 `prepareComponentToken`
 * （+ `style/index.d.ts` 的 `ComponentToken` 接口）。registry 数据：**12 个**自有 token。
 *
 * ── 默认主题判定值（2026-09-29 与 antd 6.6.4 产物逐字对拍）──────────────────────
 *
 * | token | 判定值 | 派生 |
 * |---|---|---|
 * | `itemBg` / `itemActiveBg` / `itemLinkBg` / `itemInputBg` | `#ffffff` | `colorBgContainer` |
 * | `itemSize` / `itemSizeSM` / `itemSizeLG` | `32px` / `24px` / `40px` | `controlHeight` / `-SM` / `-LG` |
 * | `itemActiveColor` / `itemActiveColorHover` | `#1677ff` / `#4096ff` | `colorPrimary` / `colorPrimaryHover` |
 * | `itemActiveColorDisabled` | `rgba(0,0,0,0.25)` | `colorTextDisabled` |
 * | `itemActiveBgDisabled` | `rgba(0,0,0,0.15)` | `controlItemBgActiveDisabled` |
 * | `miniOptionsSizeChangerTop` | `0px` | 字面量 |
 *
 * 验证命令（可复现）：`node tests/visual/debug/extract-pagination-css.mjs --tokens`
 * （该命令还会打印**输入框族**与三个派生 token 的判定值 —— 见下）
 *
 * ── 输入框族（`initComponentToken` / `initInputToken` 展开，**本文件本地复刻**）──────
 *
 * antd 的 pagination 调 `initComponentToken(token)` 把**输入框族的 20 个 token**
 * 也注册进 `--ant-pagination-*` 命名空间（尺寸切换器的 Select 与快速跳转的 input 消费它们）。
 *
 * ⚠️ 本仓**刻意不跨组件 import** `input/style/token.ts` —— 与 `input-number/style/token.ts`
 *    的先例一致（那两个文件里都写明了理由：antd 上游就是每个组件各自调
 *    `initComponentToken`，本仓按组件隔离同构复刻）。这里同样只复刻**公式**，
 *    判定值与 input 的同名 token 必然相同（同一份 seed）。
 *
 * ── 三个派生 token（不在 12 个里，但规则会消费）──────────────────────────────────
 *
 *   - `itemSizeActual`  = `var(--{p}-pagination-item-size)`（**var 套 var**，产物逐字）
 *   - `itemSpacingActual` = `var(--{p}-margin-xs)`
 *   - `miniOptionsSizeChangerTop` = `0px`（已在 12 个里）
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { toCssSize } from '../../_internal/to-css-size';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** 数值 → `px` 串（静态 CSS 不给裸数字补单位）。 */
const px = (value: number): string => toCssSize(value) ?? `${value}px`;

/** antd `ComponentToken` 的 12 个自有字段。 */
export interface ComponentToken {
  /** 页码背景色。 */
  itemBg: string;
  /** 页码尺寸。 */
  itemSize: string;
  /** 小号页码尺寸。 */
  itemSizeSM: string;
  /** 大号页码尺寸。 */
  itemSizeLG: string;
  /** 页码激活态背景色。 */
  itemActiveBg: string;
  /** 页码激活态文字色。 */
  itemActiveColor: string;
  /** 页码激活态文字 hover 色。 */
  itemActiveColorHover: string;
  /** 页码链接背景色。 */
  itemLinkBg: string;
  /** 激活态禁用背景色。 */
  itemActiveBgDisabled: string;
  /** 激活态禁用文字色。 */
  itemActiveColorDisabled: string;
  /** 输入类元素（快速跳转 / 尺寸切换）背景色。 */
  itemInputBg: string;
  /** mini 形态下尺寸切换器的上边距（`0px`）。 */
  miniOptionsSizeChangerTop: string;
}

/**
 * 输入框族（`initComponentToken` + `initInputToken`）的 20 个字段。
 *
 * ⚠️ 与 `input/style/token.ts` 的 `ComponentToken` **同名同式**（同源 seed ⇒ 同判定值），
 *    但**不 import** —— 见文件头的先例说明。
 */
export interface PaginationInputToken {
  lineWidthFocus: string;
  paddingBlock: string;
  paddingBlockSM: string;
  paddingBlockLG: string;
  paddingInline: string;
  paddingInlineSM: string;
  paddingInlineLG: string;
  addonBg: string;
  activeBorderColor: string;
  hoverBorderColor: string;
  activeShadow: string;
  errorActiveShadow: string;
  warningActiveShadow: string;
  hoverBg: string;
  activeBg: string;
  inputFontSize: string;
  inputFontSizeLG: string;
  inputFontSizeSM: string;
  inputAffixPadding: string;
}

/** `prepareComponentToken` 的入参面（AliasToken 的子集）。 */
export interface PaginationSeedToken {
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
  colorBgContainer: string;
  colorPrimary: string;
  colorPrimaryHover: string;
  colorTextDisabled: string;
  controlItemBgActiveDisabled: string;
}

/** antd `prepareComponentToken` 的逐条对齐实现（自有 12 个）。 */
export function prepareComponentToken(token: PaginationSeedToken): ComponentToken {
  return {
    itemBg: token.colorBgContainer,
    itemSize: px(token.controlHeight),
    itemSizeSM: px(token.controlHeightSM),
    itemSizeLG: px(token.controlHeightLG),
    itemActiveBg: token.colorBgContainer,
    itemActiveColor: token.colorPrimary,
    itemActiveColorHover: token.colorPrimaryHover,
    itemLinkBg: token.colorBgContainer,
    itemActiveColorDisabled: token.colorTextDisabled,
    itemActiveBgDisabled: token.controlItemBgActiveDisabled,
    itemInputBg: token.colorBgContainer,
    miniOptionsSizeChangerTop: px(0),
  };
}

/** `initComponentToken` + `initInputToken` 的本地复刻（公式与 input 同式）。 */
export function prepareInputToken(token: PaginationSeedToken): PaginationInputToken {
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

/**
 * 三个**派生** token（不在 12 个里，但规则会消费）。
 *
 * ⚠️ `itemSizeActual` 是**var 套 var**（产物逐字 `var(--ant-pagination-item-size)`），
 *    `itemSpacingActual` 指到主题的 `marginXS`；两者都不是构建期常量。
 */
export function paginationDerivedToken(prefixCls: string): {
  itemSizeActual: string;
  itemSpacingActual: string;
} {
  return {
    itemSizeActual: `var(--${prefixCls}-pagination-item-size)`,
    itemSpacingActual: v('marginXS'),
  };
}

let tokenCache: ComponentToken | null = null;
let inputCache: PaginationInputToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 seed）。 */
export function paginationTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken() as unknown as PaginationSeedToken);
  }
  return tokenCache;
}

/** 输入框族的构建期值（缓存）。 */
export function paginationInputTokenValues(): PaginationInputToken {
  if (!inputCache) {
    inputCache = prepareInputToken(getDesignToken() as unknown as PaginationSeedToken);
  }
  return inputCache;
}
