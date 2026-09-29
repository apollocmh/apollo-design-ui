/**
 * Slider 的公共导出。
 *
 * 与 antd 的 es/slider/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import SliderComponent from './Slider.vue';

/** Slider 组件。注册名 `ASlider`（COMPONENT-RULES.md 规则 R2）。 */
export const Slider = withInstall(SliderComponent);

export default Slider;

// TODO(G2): export type { SliderProps, SliderRef, ... } from './interface';
// TODO(G4): export { genSliderStyle } from './style';
// TODO(G4): export type { ComponentToken as SliderComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareSliderComponentToken } from './style/token';
