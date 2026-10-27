/** The twelve existing Avatar tokens, derived from the current alias theme. */

import type { AliasToken } from '@apollo-design/theme';

/** Avatar 的 Component Token。与上游逐字对齐（12 个）。 */
export interface ComponentToken {
  /** @desc 头像尺寸 */
  containerSize: number;
  /** @desc 大号头像尺寸 */
  containerSizeLG: number;
  /** @desc 小号头像尺寸 */
  containerSizeSM: number;
  /** @desc 头像文字大小 */
  textFontSize: number;
  /** @desc 大号头像文字大小 */
  textFontSizeLG: number;
  /** @desc 小号头像文字大小 */
  textFontSizeSM: number;
  /** @desc 头像图标大小 */
  iconFontSize: number;
  /** @desc 大号头像图标大小 */
  iconFontSizeLG: number | string;
  /** @desc 小号头像图标大小 */
  iconFontSizeSM: number;
  /** @desc 头像组间距 */
  groupSpace: number;
  /** @desc 头像组重叠宽度 */
  groupOverlapping: number;
  /** @desc 头像组边框颜色 */
  groupBorderColor: string;
}

/**
 * 与上游的 `prepareComponentToken` 逐字对应。
 *
 * ⚠️ 键的**顺序**与上游一致（`containerSize` → `containerSizeLG` → `containerSizeSM`
 * → `textFontSize` → `textFontSizeLG` → `textFontSizeSM` → `iconFontSize`
 * → `iconFontSizeLG` → `iconFontSizeSM` → `groupSpace` → `groupOverlapping`
 * → `groupBorderColor`）—— 与产物的 css-var 声明块顺序**逐条一致**，G3 的用例逐键断言。
 *
 * ⚠️ `iconFontSize` 是 **`Math.round`** 后的值：`Math.round((fontSizeLG + fontSizeXL) / 2)`
 *    = `Math.round((16 + 20) / 2)` = 18。`Math.round` 不能省（换主题后可能是 .5）。
 */
export const prepareComponentToken = (token: AliasToken): ComponentToken => ({
  containerSize: token.controlHeight,
  containerSizeLG: token.controlHeightLG,
  containerSizeSM: token.controlHeightSM,
  textFontSize: token.fontSize,
  textFontSizeLG: token.fontSize,
  textFontSizeSM: token.fontSize,
  iconFontSize: Math.round((token.fontSizeLG + token.fontSizeXL) / 2),
  iconFontSizeLG: token.fontSizeHeading3,
  iconFontSizeSM: token.fontSize,
  groupSpace: token.marginXXS,
  groupOverlapping: -token.marginXS,
  groupBorderColor: token.colorBorderBg,
});
