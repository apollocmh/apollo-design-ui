/**
 * Dropdown 的 Component Token（G3/G4 产物）。
 *
 * 契约来源：antd 6.6.4 `es/dropdown/style/index.js`（prepareComponentToken +
 * genDropdownToken）。registry 数据：组 token 数 = 2（zIndexPopup / paddingBlock
 * —— arrow 系列是 antd 标 @internal 的派生 token，复用 tooltip/style/token.ts
 * 的 roundedArrow / placementArrow 派生（antd 的 components/style/* 同源）。
 *
 * 关键判定值由 L7 与 style/index.ts 的 DECLS 字面量逐字对拍。
 */

import { getArrowOffsetToken, getArrowToken } from '../../tooltip/style/token';

export interface ComponentToken {
  /** `zIndexPopupBase + 50`（menu 同款）。 */
  zIndexPopup: number;
  /** 5。 */
  paddingBlock: number;
  arrowOffsetHorizontal: number;
  arrowOffsetVertical: number;
  arrowShadowWidth: number;
  arrowPath: string;
  arrowPolygon: string;
}

export interface DropdownSeedToken {
  zIndexPopupBase: number;
  sizePopupArrow: number;
  borderRadius: number;
  borderRadiusXS: number;
  borderRadiusOuter: number;
  marginXXS: number;
}

/** antd prepareComponentToken 的关键判定（menu 同构；limitVerticalRadius 无）。 */
export function prepareComponentToken(token: DropdownSeedToken): ComponentToken {
  const {
    zIndexPopupBase,
    sizePopupArrow,
    borderRadius,
    borderRadiusXS,
    borderRadiusOuter,
    marginXXS,
  } = token;

  const arrow = getArrowToken({
    sizePopupArrow,
    borderRadiusXS,
    borderRadiusOuter,
  });
  const offset = getArrowOffsetToken({
    contentRadius: borderRadius,
    limitVerticalRadius: true,
  });

  return {
    zIndexPopup: zIndexPopupBase + 50,
    paddingBlock: 5,
    // antd：arrowOffsetHorizontal = offset[0] === borderRadius ? marginXXS : offset[0]
    arrowOffsetHorizontal:
      offset.arrowOffsetHorizontal === borderRadius ? marginXXS : offset.arrowOffsetHorizontal,
    arrowOffsetVertical: offset.arrowOffsetVertical,
    arrowShadowWidth: arrow.arrowShadowWidth,
    arrowPath: arrow.arrowPath,
    arrowPolygon: arrow.arrowPolygon,
  };
}

/** 默认主题的判定值（L7 对拍 DECLS 字面量）。 */
export function dropdownTokenValues(): ComponentToken {
  return prepareComponentToken({
    zIndexPopupBase: 1000,
    sizePopupArrow: 16,
    borderRadius: 6,
    borderRadiusXS: 2,
    borderRadiusOuter: 4,
    marginXXS: 4,
  });
}
