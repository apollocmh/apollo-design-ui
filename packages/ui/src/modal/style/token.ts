/**
 * Modal 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 `components/modal/style/index.ts` 的 `ComponentToken` /
 * `ModalToken` / `prepareToken` / `prepareComponentToken`。
 *
 * ⚠️ **三层的区分（不要混）**：
 *   1. `ComponentToken`（**公开 6 键**，= registry 的 `tokenCount: 6`）：
 *      `headerBg` / `titleLineHeight` / `titleFontSize` / `titleColor` / `contentBg` / `footerBg`
 *      —— 用户可经 `theme.components.Modal` 覆盖；
 *   2. `ModalInternalToken`（**12 键**，上游 `prepareComponentToken` 里标 `// internal` 的部分）：
 *      它们同样被 cssinjs 序列化成 CSS 变量（所以 DECLS 里一共 18 个键），
 *      但**不在公开类型面**里 —— 别把它们塞进 `ComponentToken`；
 *   3. `ModalDerivedToken`（**9 键**，上游 `ModalToken`）：由 `prepareToken` 用
 *      `calc()` 组合出来，**不落 CSS 变量**，在规则里以 `calc(...)` 内联出现。
 *
 * ⚠️ 修正一处此前的记录：G1 第一遍曾把「`prepareComponentToken` 返回对象的 19 个键」
 *    当成 ComponentToken 的规模（写成「24 键」）。**公开面是 6 键**，registry 的
 *    `tokenCount: 6` 是对的。
 */

import { getDesignToken } from '@apollo-design/theme';

/** 公开的 Component Token（antd `ComponentToken`，逐条对齐）。 */
export interface ComponentToken {
  /** 顶部背景色。 */
  headerBg: string;
  /** 标题行高（**unitless**，见 genStyleHooks 的 `unitless`）。 */
  titleLineHeight: number | string;
  /** 标题字体大小。 */
  titleFontSize: number | string;
  /** 标题字体颜色。 */
  titleColor: string;
  /** 内容区域背景色。 */
  contentBg: string;
  /** 底部区域背景色。 */
  footerBg: string;
}

/**
 * 内部 token（上游 `prepareComponentToken` 的 `// internal` 段）。
 * 会落成 CSS 变量，但**不在公开类型面**。
 */
export interface ModalInternalToken {
  contentPadding: string | number;
  headerPadding: string | number;
  headerBorderBottom: string;
  headerMarginBottom: number | string;
  bodyPadding: number | string;
  footerPadding: string | number;
  footerBorderTop: string;
  footerBorderRadius: string | number;
  footerMarginTop: number | string;
  confirmBodyPadding: string | number;
  confirmIconMarginInlineEnd: number | string;
  confirmBtnsMarginTop: number | string;
}

/** `prepareComponentToken` 的完整返回（公开 6 + 内部 12 + `mask`）。 */
export interface ModalComponentToken extends ComponentToken, ModalInternalToken {
  /** 是否渲染遮罩。⚠️ 不落 CSS 变量（上游的返回值里有它，css-var 块里没有）。 */
  mask: boolean;
}

/** `prepareToken` 派生的 9 个内部键（上游 `ModalToken`，**不落 CSS 变量**）。 */
export interface ModalDerivedToken {
  /** `lineHeightHeading5 * fontSizeHeading5 + padding * 2`。 */
  modalHeaderHeight: number | string;
  /** `colorSplit`。 */
  modalFooterBorderColorSplit: string;
  /** `lineType`。 */
  modalFooterBorderStyle: string;
  /** `lineWidth`。 */
  modalFooterBorderWidth: number | string;
  /** `colorIcon`。 */
  modalCloseIconColor: string;
  /** `colorIconHover`。 */
  modalCloseIconHoverColor: string;
  /** `controlHeight`。 */
  modalCloseBtnSize: number | string;
  /** `fontHeight`。 */
  modalConfirmIconSize: number | string;
  /** `titleFontSize * titleLineHeight`。 */
  modalTitleHeight: number | string;
}

/** `prepareComponentToken` 的入参面（AliasToken 子集）。 */
export interface ModalSeedToken {
  wireframe?: boolean;
  lineHeightHeading5: number;
  fontSizeHeading5: number;
  colorBgElevated: string;
  colorTextHeading: string;
  paddingMD: number;
  paddingContentHorizontalLG: number;
  padding: number;
  paddingLG: number;
  paddingXS: number;
  lineWidth: number;
  lineType: string;
  colorSplit: string;
  marginXS: number;
  marginSM: number;
  margin: number;
  marginLG: number;
  borderRadiusLG: number;
}

/** antd 的 `unit()`：数字补 `px`，字符串原样。 */
function unit(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

/** antd `prepareComponentToken`（逐条对齐，含 `wireframe` 分支）。 */
export function prepareComponentToken(token: ModalSeedToken): ModalComponentToken {
  const {
    wireframe,
    lineHeightHeading5,
    fontSizeHeading5,
    colorBgElevated,
    colorTextHeading,
    paddingMD,
    paddingContentHorizontalLG,
    padding,
    paddingLG,
    paddingXS,
    lineWidth,
    lineType,
    colorSplit,
    marginXS,
    marginSM,
    margin,
    marginLG,
    borderRadiusLG,
  } = token;

  return {
    // ---- 公开 6 键 ----
    footerBg: 'transparent',
    headerBg: 'transparent',
    titleLineHeight: lineHeightHeading5,
    titleFontSize: fontSizeHeading5,
    contentBg: colorBgElevated,
    titleColor: colorTextHeading,
    // ---- internal 12 键 ----
    contentPadding: wireframe ? 0 : `${unit(paddingMD)} ${unit(paddingContentHorizontalLG)}`,
    headerPadding: wireframe ? `${unit(padding)} ${unit(paddingLG)}` : 0,
    headerBorderBottom: wireframe ? `${unit(lineWidth)} ${lineType} ${colorSplit}` : 'none',
    headerMarginBottom: wireframe ? 0 : marginXS,
    bodyPadding: wireframe ? paddingLG : 0,
    footerPadding: wireframe ? `${unit(paddingXS)} ${unit(padding)}` : 0,
    footerBorderTop: wireframe ? `${unit(lineWidth)} ${lineType} ${colorSplit}` : 'none',
    footerBorderRadius: wireframe ? `0 0 ${unit(borderRadiusLG)} ${unit(borderRadiusLG)}` : 0,
    footerMarginTop: wireframe ? 0 : marginSM,
    confirmBodyPadding: wireframe
      ? `${unit(padding * 2)} ${unit(padding * 2)} ${unit(paddingLG)}`
      : 0,
    confirmIconMarginInlineEnd: wireframe ? margin : marginSM,
    confirmBtnsMarginTop: wireframe ? marginLG : marginSM,
    // ---- mask ----
    mask: true,
  };
}

let tokenCache: ModalComponentToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 token）。 */
export function modalTokenValues(): ModalComponentToken {
  if (!tokenCache) {
    const seed = getDesignToken() as unknown as ModalSeedToken;
    tokenCache = prepareComponentToken(seed);
  }
  return tokenCache;
}
