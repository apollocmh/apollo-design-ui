/** Apollo component Tokens. Historical starting point: antd 6.6.4 descriptions/style.
 * Current defaults follow the documented Apollo contracts; static CSS consumes
 * current aliases and explicit component overrides rather than cached build values. */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** bordered 形态 label 格背景色（= `colorFillAlter`）。 */
  labelBg: string;
  /** label 文字色（= `colorTextSecondary`，适用于普通和带边框形态）。 */
  labelColor: string;
  /** 标题文字色（= `colorText`）。 */
  titleColor: string;
  /** 标题下间距（= `fontSizeSM * lineHeightSM`）。 */
  titleMarginBottom: number | string;
  /** 条目纵向 padding（= `padding`）。 */
  itemPaddingBottom: number | string;
  /** 条目行内尾 padding（= `padding`）。 */
  itemPaddingEnd: number | string;
  /** 冒号右间距（= `marginXS`）。 */
  colonMarginRight: number | string;
  /** 冒号左间距（= `marginXXS / 2`）。 */
  colonMarginLeft: number | string;
  /** 内容文字色（= `colorText`）。 */
  contentColor: string;
  /** extra 文字色（= `colorText`）。 */
  extraColor: string;
}

export const prepareComponentToken = (token: AliasToken): ComponentToken => ({
  labelBg: token.colorFillAlter,
  labelColor: token.colorTextSecondary,
  titleColor: token.colorText,
  titleMarginBottom: token.fontSizeSM * token.lineHeightSM,
  itemPaddingBottom: token.padding,
  itemPaddingEnd: token.padding,
  colonMarginRight: token.marginXS,
  colonMarginLeft: token.marginXXS / 2,
  contentColor: token.colorText,
  extraColor: token.colorText,
});

export default prepareComponentToken;
