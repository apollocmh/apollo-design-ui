/**
 * Tooltip 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/tooltip/style/index.ts`（`prepareComponentToken`）+
 * `components/style/placementArrow.ts`（getArrowOffsetToken）+
 * `components/style/roundedArrow.ts`（getArrowToken）。registry 数据：组 token 数 = 2
 * （zIndexPopup / maxWidth —— arrow 系列是 antd 标 @internal 的派生 token）。
 *
 * 全部为**构建期解析值**（collapse D46/D50 同判）：箭头路径/多边形是含主题圆角
 * 的字面量，静态 CSS 无法运行时重算。
 */

import { getDesignToken } from '@apollo-design/theme';

/** antd `getArrowOffsetToken({ contentRadius, limitVerticalRadius: true })`。 */
export function getArrowOffsetToken(options: {
  contentRadius: number;
  limitVerticalRadius?: boolean;
}): { arrowOffsetHorizontal: number; arrowOffsetVertical: number } {
  const { contentRadius, limitVerticalRadius } = options;
  const arrowOffset = contentRadius > 12 ? contentRadius + 2 : 12;
  const arrowOffsetVertical = limitVerticalRadius ? 8 : arrowOffset; // MAX_VERTICAL_CONTENT_RADIUS = 8
  return { arrowOffsetHorizontal: arrowOffset, arrowOffsetVertical };
}

/** antd `getArrowToken(token)`（roundedArrow.ts，逐条对齐）。 */
export function getArrowToken(token: {
  sizePopupArrow: number;
  borderRadiusXS: number;
  borderRadiusOuter: number;
}): { arrowShadowWidth: number; arrowPath: string; arrowPolygon: string } {
  const { sizePopupArrow, borderRadiusXS, borderRadiusOuter } = token;

  const unitWidth = sizePopupArrow / 2;

  const ax = 0;
  const ay = unitWidth;
  const bx = (borderRadiusOuter * 1) / Math.sqrt(2);
  const by = unitWidth - borderRadiusOuter * (1 - 1 / Math.sqrt(2));
  const cx = unitWidth - borderRadiusXS * (1 / Math.sqrt(2));
  const cy = borderRadiusOuter * (Math.sqrt(2) - 1) + borderRadiusXS * (1 / Math.sqrt(2));
  const dx = 2 * unitWidth - cx;
  const dy = cy;
  const ex = 2 * unitWidth - bx;
  const ey = by;
  const fx = 2 * unitWidth - ax;
  const fy = ay;

  const shadowWidth = unitWidth * Math.sqrt(2) + borderRadiusOuter * (Math.sqrt(2) - 2);
  const polygonOffset = borderRadiusOuter * (Math.sqrt(2) - 1);

  const arrowPolygon = `polygon(${polygonOffset}px 100%, 50% ${polygonOffset}px, ${
    2 * unitWidth - polygonOffset
  }px 100%, ${polygonOffset}px 100%)`;
  const arrowPath = `path('M ${ax} ${ay} A ${borderRadiusOuter} ${borderRadiusOuter} 0 0 0 ${bx} ${by} L ${cx} ${cy} A ${borderRadiusXS} ${borderRadiusXS} 0 0 1 ${dx} ${dy} L ${ex} ${ey} A ${borderRadiusOuter} ${borderRadiusOuter} 0 0 0 ${fx} ${fy} Z')`;

  return { arrowShadowWidth: shadowWidth, arrowPath, arrowPolygon };
}

/** prepareComponentToken 的公开面（registry 组 token 数 = 2）。 */
export interface ComponentToken {
  /** `zIndexPopupBase + 70`。 */
  zIndexPopup: number;
  /** 文字提示最大宽度。 */
  maxWidth: number;
}

/** 内部派生 token（arrow 系列随 ComponentToken 一起声明为 CSS 变量）。 */
export interface TooltipComponentToken extends ComponentToken {
  arrowOffsetHorizontal: number;
  arrowOffsetVertical: number;
  arrowShadowWidth: number;
  arrowPath: string;
  arrowPolygon: string;
}

/** prepareComponentToken 的入参面（AliasToken 子集）。 */
export interface TooltipSeedToken {
  zIndexPopupBase: number;
  borderRadius: number;
  borderRadiusXS: number;
  borderRadiusOuter: number;
  sizePopupArrow: number;
}

/** antd `prepareComponentToken`（逐条对齐）。 */
export function prepareComponentToken(token: TooltipSeedToken): TooltipComponentToken {
  const borderRadiusOuter = Math.min(token.borderRadiusOuter, 4);
  return {
    zIndexPopup: token.zIndexPopupBase + 70,
    maxWidth: 250,
    ...getArrowOffsetToken({
      contentRadius: token.borderRadius,
      limitVerticalRadius: true,
    }),
    ...getArrowToken({
      sizePopupArrow: token.sizePopupArrow,
      borderRadiusXS: token.borderRadiusXS,
      borderRadiusOuter,
    }),
  };
}

let tokenCache: TooltipComponentToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 seed）。 */
export function tooltipTokenValues(): TooltipComponentToken {
  if (!tokenCache) {
    const seed = getDesignToken() as unknown as TooltipSeedToken;
    tokenCache = prepareComponentToken(seed);
  }
  return tokenCache;
}
