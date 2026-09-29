/**
 * Slider 的公共导出。
 *
 * 与 antd 的 `es/slider/index.js` 对齐的对外面。
 * G2（API DESIGN）已定稿类型面；样式导出留给 G4。
 */

import { withInstall } from '../_internal/with-install';
import SliderComponent from './Slider.vue';

/** Slider 组件。注册名 `ASlider`（COMPONENT-RULES.md 规则 R2）。 */
export const Slider = withInstall(SliderComponent);

export default Slider;

export type {
  SliderAriaValueFormat,
  SliderBaseProps,
  SliderDirection,
  SliderDotStyle,
  SliderEmits,
  SliderFormatter,
  SliderHandleInfo,
  SliderMarkObject,
  SliderMarks,
  SliderOrientation,
  SliderProps,
  SliderRange,
  SliderRangeConfig,
  SliderRangeProps,
  SliderRef,
  SliderSemanticClassNames,
  SliderSemanticStyles,
  SliderSingleProps,
  SliderSlots,
  SliderTooltipProps,
  SliderValue,
} from './interface';

export { genSliderStyle, genTokenDecls as genSliderTokenDecls } from './style';
export type { ComponentToken as SliderComponentToken } from './style/token';
export { prepareComponentToken as prepareSliderComponentToken } from './style/token';
