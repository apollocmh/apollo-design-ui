/** Skeleton defaults and existing illustration/motion constants, retained from the Ant Design 6.6.4 reference. */
import type { AliasToken } from '@apollo-design/theme';
import type { CSSProperties } from 'vue';
export const CAPSULE_RADIUS_DECL = 'border-radius:100px';
export const CIRCLE_RADIUS_DECL = 'border-radius:50%';
export const IMAGE_PATH_FILL_DECL = 'fill:#bfbfbf';
export const LOADING_MOTION_DURATION = '1.4s';
export const LOADING_GRADIENT_STOPS = { from: '25%', to: '37%', back: '63%' } as const;
export const LOADING_BACKGROUND_SIZE = '400% 100%';
export const LOADING_KEYFRAME_FROM = '100% 50%';
export const LOADING_KEYFRAME_TO = '0 50%';
export const IMAGE_SIZE_BASE_MULTIPLIER = 1.5;
export const BUTTON_WIDTH_MULTIPLIER = 2;
export const INPUT_WIDTH_MULTIPLIER = 5;
export interface ComponentToken {
  /** @deprecated Use gradientFromColor. */
  color: string;
  /** @deprecated Use gradientToColor. */
  colorGradientEnd: string;
  gradientFromColor: string;
  gradientToColor: string;
  titleHeight: number | string;
  blockRadius: number;
  paragraphMarginTop: number;
  paragraphLiHeight: number;
}
export const prepareComponentToken = (token: AliasToken): ComponentToken => {
  const gradientFromColor = token.colorFillContent;
  const gradientToColor = token.colorFill;
  return {
    color: gradientFromColor,
    colorGradientEnd: gradientToColor,
    gradientFromColor,
    gradientToColor,
    titleHeight: token.controlHeight / 2,
    blockRadius: token.borderRadiusSM,
    paragraphMarginTop: token.marginLG + token.marginXXS,
    paragraphLiHeight: token.controlHeight / 2,
  };
};
export type SkeletonStyleSlot = CSSProperties;
