/**
 * DatePicker 的公共导出。
 *
 * 与 antd 的 es/date-picker/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import DatePickerComponent from './DatePicker.vue';
import RangePickerComponent from './RangePicker.vue';

/** DatePicker 组件。注册名 `ADatePicker`（COMPONENT-RULES.md 规则 R2）。 */
export const DatePicker = withInstall(DatePickerComponent);
/** RangePicker 组件（S5）。注册名 `ARangePicker`。 */
export const RangePicker = withInstall(RangePickerComponent);

/**
 * 上游的静态别名 `DatePicker.RangePicker`（`es/date-picker/index.js` 的
 * `Object.assign` 挂载）—— Vue 侧没有「函数组件带静态属性」的等价物，
 * 但**消费习惯**要兼容（antd 用户写 `<DatePicker.RangePicker />`）。
 *
 * ⚠️ `Object.assign` 是**原地**修改 ⇒ `DatePicker` 自己也带上了 `RangePicker`；
 * 返回值额外把类型带上（直接赋值需要 `as any`，H10 禁止）。
 * ⇒ 两种用法都成立：`DatePicker.RangePicker`（类型可见）与具名 `RangePicker`。
 */
export const DatePickerWithRange = Object.assign(DatePicker, { RangePicker });

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

// ---------------------------------------------------------------- 样式（G4 产物）
export { genDatePickerStyle, genTokenDecls as genDatePickerTokenDecls } from './style';
export type { ComponentToken as DatePickerComponentToken } from './style/token';
export { prepareComponentToken as prepareDatePickerComponentToken } from './style/token';
