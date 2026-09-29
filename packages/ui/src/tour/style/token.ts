/**
 * Tour 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 `es/tour/style/index.js` 的 `prepareComponentToken`
 * + `es/tour/style/index.d.ts` 的 `ComponentToken` 接口。
 * registry 数据：该组件 token 数 = 4（**自有**字段）；箭头族是 antd 标 `@internal` 的
 * 派生 token，复用 `tooltip/style/token.ts` 的 `getArrowOffsetToken` / `getArrowToken`
 * （与 dropdown / popover 同源，勿在本文件重复推导）。
 *
 * ── 与 `dropdown/style/token.ts` 的两处**判据差异**（逐字对齐 antd，勿照抄 dropdown）──
 *   1. `zIndexPopup = zIndexPopupBase + **70**`（dropdown 是 `+50`）。
 *   2. `getArrowOffsetToken({ contentRadius: **borderRadiusLG** })`（dropdown 用 `borderRadius`），
 *      且 **不做** `arrowOffsetHorizontal === borderRadius ? marginXXS : …` 的改写 ——
 *      antd 的 tour 是**直接展开** `getArrowOffsetToken` 的返回值。
 *
 * 关键判定值由 L7（`theme.test.ts`）与 `style/index.ts` 的 DECLS 字面量逐字对拍。
 *
 * ── 默认主题判定值（2026-09-28 与 antd 6.6.4 产物**逐字对拍通过**）────────────
 *   zIndexPopup            1070                （产物 `--ant-tour-z-index-popup: 1070`，**无单位**）
 *   closeBtnSize           22   → CSS 写 **22px**
 *   primaryPrevBtnBg       rgba(255,255,255,0.15)
 *   primaryNextBtnHoverBg  rgb(240,240,240)
 *   arrowOffsetHorizontal  12   → CSS 写 **12px**
 *   arrowOffsetVertical    8    → CSS 写 **8px**
 *   arrowShadowWidth       8.970562748477143 → CSS 写 **8.970562748477143px**
 *
 * ⚠️ **单位规则（G4 必读）**：antd 的 `unitless` 配置**没有**列出上面这几个数值 token
 *    ⇒ 产物里它们带 `px` 后缀（只有 `zIndexPopup` 是无单位整数）。
 *    本仓 `style/index.ts` 的 DECLS 必须照抄产物字面量（`22px` 而不是 `22`），
 *    否则「数字 token」在 CSS 里会变成无效声明（PITFALLS 170 的同族）。
 *
 * 验证命令（可复现）：`node tests/visual/debug/extract-tour-css.mjs > /tmp/antd-tour-raw.css`
 *   然后 grep `--ant-tour-`。
 */

import { Color } from '@apollo-design/utils';
import { onBackground } from '../../_internal/color-composite';

import { getArrowOffsetToken, getArrowToken } from '../../tooltip/style/token';

export interface ComponentToken {
  /** `zIndexPopupBase + 70`（默认 1000 + 70 = 1070）。 */
  zIndexPopup: number;
  /** `fontSize × lineHeight`（默认 14 × 1.5714285714285714）。 */
  closeBtnSize: number;
  /** `colorTextLightSolid` 加 0.15 透明度的 rgb 串（默认 `rgba(255,255,255,0.15)`）。 */
  primaryPrevBtnBg: string;
  /** `colorBgTextHover` 叠在 `colorWhite` 上的合成色（默认 `rgb(240,240,240)`）。 */
  primaryNextBtnHoverBg: string;
  /** ↓ 箭头族（`ArrowOffsetToken` / `ArrowToken`，与 tooltip / dropdown 共享）。 */
  arrowOffsetHorizontal: number;
  arrowOffsetVertical: number;
  arrowShadowWidth: number;
  arrowPath: string;
  arrowPolygon: string;
}

/** `prepareComponentToken` 需要的种子 / 别名 token 子集（只列真正用到的字段）。 */
export interface TourSeedToken {
  zIndexPopupBase: number;
  fontSize: number;
  lineHeight: number;
  colorTextLightSolid: string;
  colorBgTextHover: string;
  colorWhite: string;
  borderRadiusLG: number;
  sizePopupArrow: number;
  borderRadiusXS: number;
  borderRadiusOuter: number;
}

/** antd `prepareComponentToken` 的逐条对齐实现。 */
export function prepareComponentToken(token: TourSeedToken): ComponentToken {
  const {
    zIndexPopupBase,
    fontSize,
    lineHeight,
    colorTextLightSolid,
    colorBgTextHover,
    colorWhite,
    borderRadiusLG,
    sizePopupArrow,
    borderRadiusXS,
    borderRadiusOuter,
  } = token;

  const offset = getArrowOffsetToken({ contentRadius: borderRadiusLG, limitVerticalRadius: true });
  const arrow = getArrowToken({ sizePopupArrow, borderRadiusXS, borderRadiusOuter });

  return {
    zIndexPopup: zIndexPopupBase + 70,
    closeBtnSize: fontSize * lineHeight,
    primaryPrevBtnBg: new Color(colorTextLightSolid).setAlpha(0.15).toRgbString(),
    primaryNextBtnHoverBg: onBackground(colorBgTextHover, colorWhite).toRgbString(),
    arrowOffsetHorizontal: offset.arrowOffsetHorizontal,
    arrowOffsetVertical: offset.arrowOffsetVertical,
    arrowShadowWidth: arrow.arrowShadowWidth,
    arrowPath: arrow.arrowPath,
    arrowPolygon: arrow.arrowPolygon,
  };
}

/** 默认主题的判定值（L7 对拍 `style/index.ts` 的 DECLS 字面量）。 */
export function tourTokenValues(): ComponentToken {
  return prepareComponentToken({
    zIndexPopupBase: 1000,
    fontSize: 14,
    lineHeight: 1.5714285714285714,
    colorTextLightSolid: '#fff',
    colorBgTextHover: 'rgba(0,0,0,0.06)',
    colorWhite: '#fff',
    borderRadiusLG: 8,
    sizePopupArrow: 16,
    borderRadiusXS: 2,
    borderRadiusOuter: 4,
  });
}

/**
 * `mergeToken` 注入的**内部**值（不进 ComponentToken 公开面，但样式要用）。
 *
 * antd：`mergeToken(token, { indicatorWidth: 6, indicatorHeight: 6,
 * tourBorderRadius: borderRadiusLG })`。
 */
export interface TourInternalToken {
  indicatorWidth: number;
  indicatorHeight: number;
  tourBorderRadius: number;
}

/** 默认主题下的内部 token（L7 对拍）。 */
export function tourInternalTokenValues(): TourInternalToken {
  return { indicatorWidth: 6, indicatorHeight: 6, tourBorderRadius: 8 };
}
