/**
 * TimePicker 的公共导出。
 *
 * 与 antd 的 es/time-picker/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import TimePickerComponent from './TimePicker.vue';

/** TimePicker 组件。注册名 `ATimePicker`（COMPONENT-RULES.md 规则 R2）。 */
export const TimePicker = withInstall(TimePickerComponent);

export default TimePicker;

// TODO(G2): export type { TimePickerProps, TimePickerRef, ... } from './interface';
// TODO(G4): export { genTimePickerStyle } from './style';
// TODO(G4): export type { ComponentToken as TimePickerComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareTimePickerComponentToken } from './style/token';
