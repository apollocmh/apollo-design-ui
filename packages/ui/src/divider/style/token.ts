import type { AliasToken } from '@apollo-design/theme';
import type { CSSProperties } from 'vue';

/** Component defaults are declared in static CSS and overridden on the owning root. */
export interface ComponentToken {
  /**
   * @desc 文本横向内间距
   * @descEN Horizontal padding of text
   */
  textPaddingInline: CSSProperties['paddingInline'];
  /**
   * @desc 文本与边缘距离，取值 0 ～ 1
   * @descEN Distance between text and edge, a number from 0 to 1.
   */
  orientationMargin?: number;
  /**
   * @desc 纵向分割线的横向外间距
   * @descEN Horizontal margin of vertical Divider
   */
  verticalMarginInline: CSSProperties['marginInline'];
}
export const TEXT_PADDING_INLINE: NonNullable<ComponentToken['textPaddingInline']> = '1em';
export const ORIENTATION_MARGIN = 0.05;
/** Existing medium title typography; kept separate from the global strong weight. */
export const TITLE_FONT_WEIGHT = 500;
/** Preserve the established defaults; component configuration is consumed by useDividerTheme. */
export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => ({
  textPaddingInline: TEXT_PADDING_INLINE,
  orientationMargin: ORIENTATION_MARGIN,
  verticalMarginInline: token.marginXS,
});
