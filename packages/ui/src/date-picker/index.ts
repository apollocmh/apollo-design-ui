/**
 * DatePicker 的公共导出。
 *
 * 与 antd 的 es/date-picker/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import DatePickerComponent from './DatePicker.vue';

/** DatePicker 组件。注册名 `ADatePicker`（COMPONENT-RULES.md 规则 R2）。 */
export const DatePicker = withInstall(DatePickerComponent);

export default DatePicker;

// ---------------------------------------------------------------- 类型（G2 产物）
// ⚠️ `DatePickerProps` / `RangePickerProps` 是**完整**的对外面（见 interface.ts 文件头），
//    含全部 deprecated 字段 —— 类型面不裁剪，裁剪会让迁移时「类型过了但运行时没实现」。
// ---------------------------------------------------------------------------
export type {
  CellRender,
  CellRenderInfo,
  CustomFormat,
  CustomTagProps,
  DatePickerDate,
  DatePickerDirection,
  DatePickerEmits,
  DatePickerExpose,
  DatePickerFormat,
  DatePickerGenerateConfig,
  DatePickerMode,
  DatePickerPanelMode,
  DatePickerPlacement,
  DatePickerProps,
  DatePickerSemanticClassNames,
  DatePickerSemanticStyles,
  DatePickerSemanticValue,
  DatePickerSize,
  DatePickerSlots,
  DatePickerStatus,
  DatePickerVariant,
  DisabledDate,
  DisabledTimes,
  FormatType,
  LimitDate,
  MaskFormatConfig,
  NoUndefinedRangeValue,
  OpenConfig,
  PickerCommonProps,
  PickerPopupSemanticClassNames,
  PickerPopupSemanticStyles,
  PurePanelProps,
  PureRangePanelProps,
  RangePickerEmits,
  RangePickerExpose,
  RangePickerProps,
  RangeTimeProps,
  RangeValue,
  RangeValueDate,
  SharedTimeProps,
  SingleValue,
  ValueDate,
} from './interface';

// TODO(G4): export { genDatePickerStyle } from './style';
// TODO(G4): export type { ComponentToken as DatePickerComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareDatePickerComponentToken } from './style/token';
