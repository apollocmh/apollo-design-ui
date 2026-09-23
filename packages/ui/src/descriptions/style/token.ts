/**
 * Descriptions 的 Component Token（antd `prepareComponentToken` 全 **10 个字段**）。
 *
 * 契约来源：antd 6.6.4 的 `es/descriptions/style/index.js`：
 *
 * ```js
 * export const prepareComponentToken = token => ({
 *   labelBg: token.colorFillAlter,
 *   labelColor: token.colorTextTertiary,
 *   titleColor: token.colorText,
 *   titleMarginBottom: token.fontSizeSM * token.lineHeightSM,
 *   itemPaddingBottom: token.padding,
 *   itemPaddingEnd: token.padding,
 *   colonMarginRight: token.marginXS,
 *   colonMarginLeft: token.marginXXS / 2,
 *   contentColor: token.colorText,
 *   extraColor: token.colorText,
 * });
 * ```
 *
 * ── 落地形态（与 radio 的 D46 同判）─────────────────────────────────────────
 *
 * - **纯别名引用**（labelBg / labelColor / titleColor / contentColor / extraColor /
 *   itemPaddingBottom / itemPaddingEnd / colonMarginRight）走
 *   `var(--apollo-*)`，随主题自适应；
 * - **乘法派生**（titleMarginBottom = fontSizeSM * lineHeightSM）走构建期 JS 解析值
 *   —— 浮点 hazard：calc 乘法会得到 `21.999999999999996` 这类亚像素
 *   （switch 的 trackHeight 同判）；
 * - **除法派生**（colonMarginLeft = marginXXS / 2）走 `calc(var() / 2)`
 *   （除数是整常量，安全）。
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** bordered 形态 label 格背景色（= `colorFillAlter`）。 */
  labelBg: string;
  /** label 文字色（= `colorTextTertiary`）。 */
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
  labelColor: token.colorTextTertiary,
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
