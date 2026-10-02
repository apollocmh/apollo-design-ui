/**
 * ColorPicker 的公共导出。
 *
 * 与 antd 的 es/color-picker/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import ColorPickerComponent from './ColorPicker.vue';

/** ColorPicker 组件。注册名 `AColorPicker`（COMPONENT-RULES.md 规则 R2）。 */
export const ColorPicker = withInstall(ColorPickerComponent);

export default ColorPicker;

// TODO(G2): export type { ColorPickerProps, ColorPickerRef, ... } from './interface';
// TODO(G4): export { genColorPickerStyle } from './style';
// TODO(G4): export type { ComponentToken as ColorPickerComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareColorPickerComponentToken } from './style/token';
