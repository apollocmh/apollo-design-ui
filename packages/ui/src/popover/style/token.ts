/**
 * Popover 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的 `components/popover/style/index.ts`
 * （`prepareComponentToken`）+ `components/style/placementArrow.ts` +
 * `components/style/roundedArrow.ts`。registry 数据：组 token 数 = 4
 * （titleMinWidth / zIndexPopup / innerPadding / titleMarginBottom ——
 * arrow 系列与其余 internal 是 antd 标 @internal 的派生 token）。
 *
 * 全部为**构建期解析值**（collapse D46/D50 同判）。wireframe 主题态不支持
 * （D84）：titlePadding=0 / titleBorderBottom=none / innerContentPadding=0
 * 取非线框缺省。
 */

import { getDesignToken } from '@apollo-design/theme';

import { getArrowOffsetToken, getArrowToken } from '../../tooltip/style/token';

/** prepareComponentToken 的公开面（registry 组 token 数 = 4）。 */
export interface ComponentToken {
  /** 气泡卡片标题最小宽度。 */
  titleMinWidth: number;
  /** `zIndexPopupBase + 30`。 */
  zIndexPopup: number;
  /** @internal 容器内边距（非线框 = 12）。 */
  innerPadding: number;
  /** @internal 标题下边距（非线框 = marginXS = 8）。 */
  titleMarginBottom: number;
}

/** 内部派生 token（随 ComponentToken 一起声明为 CSS 变量）。 */
export interface PopoverComponentToken extends ComponentToken {
  arrowOffsetHorizontal: number;
  arrowOffsetVertical: number;
  arrowShadowWidth: number;
  arrowPath: string;
  arrowPolygon: string;
  titlePadding: string;
  titleBorderBottom: string;
  innerContentPadding: string;
}

/** prepareComponentToken 的入参面（AliasToken 子集）。 */
export interface PopoverSeedToken {
  zIndexPopupBase: number;
  borderRadiusLG: number;
  sizePopupArrow: number;
  borderRadiusXS: number;
  borderRadiusOuter: number;
}

/** antd `prepareComponentToken('Popover')`（非线框分支，逐条对齐）。 */
export function prepareComponentToken(token: PopoverSeedToken): PopoverComponentToken {
  const { zIndexPopupBase, borderRadiusLG, sizePopupArrow, borderRadiusXS, borderRadiusOuter } =
    token;

  const arrow = getArrowToken({ sizePopupArrow, borderRadiusXS, borderRadiusOuter });
  const offset = getArrowOffsetToken({ contentRadius: borderRadiusLG, limitVerticalRadius: true });

  return {
    titleMinWidth: 177,
    zIndexPopup: zIndexPopupBase + 30,
    ...arrow,
    ...offset,
    innerPadding: 12,
    titleMarginBottom: 8,
    titlePadding: '0px',
    titleBorderBottom: 'none',
    innerContentPadding: '0px',
  };
}

let tokenCache: PopoverComponentToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 seed）。 */
export function popoverTokenValues(): PopoverComponentToken {
  if (!tokenCache) {
    const seed = getDesignToken() as unknown as PopoverSeedToken;
    tokenCache = prepareComponentToken(seed);
  }
  return tokenCache;
}
