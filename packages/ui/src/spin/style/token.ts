/** Spin component tokens consumed by the owning root's static CSS variables. */
import type { AliasToken } from '@apollo-design/theme';

export const CONTENT_HEIGHT = 400;
export interface ComponentToken {
  /**
   * @desc 嵌套加载层最大高度，不限制正文或全屏遮罩
   * @descEN Maximum nested loading-layer height; content and fullscreen are unrestricted
   */
  contentHeight: number | string;
  /**
   * @desc 加载图标尺寸
   * @descEN Loading icon size
   */
  dotSize: number;
  /**
   * @desc 小号加载图标尺寸
   * @descEN Small loading icon size
   */
  dotSizeSM: number;
  /**
   * @desc 大号加载图标尺寸
   * @descEN Large loading icon size
   */
  dotSizeLG: number;
}

export const prepareComponentToken = (token: AliasToken): ComponentToken => ({
  contentHeight: CONTENT_HEIGHT,
  dotSize: token.controlHeightLG / 2,
  dotSizeSM: token.controlHeightLG * 0.35,
  dotSizeLG: token.controlHeight,
});
