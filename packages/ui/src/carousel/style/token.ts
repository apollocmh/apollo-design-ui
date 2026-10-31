/** The existing eight Carousel component tokens. Static CSS supplies defaults;
 * current Provider values and CSS lengths are consumed on the actual root.
 * Arrow geometry derives from arrowSize in CSS, including arbitrary lengths. */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 箭头尺寸。 */
  arrowSize: number | string;
  /** 箭头到边缘的距离（= `marginXS`）。 */
  arrowOffset: number | string;
  /** 圆点宽。 */
  dotWidth: number | string;
  /** 圆点高。 */
  dotHeight: number | string;
  /** 圆点间距（= `marginXXS`）。 */
  dotGap: number | string;
  /** 圆点到边缘的距离。 */
  dotOffset: number | string;
  /** @deprecated 用 `dotActiveWidth`。 */
  dotWidthActive: number | string;
  /** 激活圆点宽（纵向时为高）。 */
  dotActiveWidth: number | string;
}

/** antd 的 `arrowLength = arrowSize / Math.SQRT2`（样式内 √2 算术的唯一来源）。 */
export const CAROUSEL_ARROW_LENGTH_SCALE = 1 / Math.SQRT2;

/** antd 的 DotDuration CSS 变量名（挂在根节点 style 上）。 */
export const CAROUSEL_DOT_DURATION_VAR = '--dot-duration';

/**
 * 箭头颜色声明。
 *
 * antd 的 `genArrowsStyle` 里 `.slick-prev,.slick-next` 是 `color: '#fff'` ——
 * **字面量**（没有 token、用户不可覆盖）。E10 对 `token.ts` 豁免，唯一真源在这里
 * （与 switch 的 `LOADING_ICON_COLOR_DECL` 同形；箭头在色块上，色值不随主题变）。
 */
export const CAROUSEL_ARROW_COLOR_DECL = 'color:#fff';

/**
 * 箭头尖角圆角声明。
 *
 * antd 的 `::after` 是 `borderRadius: 1`（cssinjs 产物 `1px`）—— 同为字面量。
 */
export const CAROUSEL_ARROW_TIP_RADIUS_DECL = 'border-radius:1px';

export const prepareComponentToken = (token: AliasToken): ComponentToken => {
  const dotActiveWidth = 24;
  return {
    arrowSize: 16,
    arrowOffset: token.marginXS,
    dotWidth: 16,
    dotHeight: 3,
    dotGap: token.marginXXS,
    dotOffset: 12,
    dotWidthActive: dotActiveWidth,
    dotActiveWidth,
  };
};

export default prepareComponentToken;
