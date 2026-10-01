/**
 * @apollo-design/picker
 *
 * 日期/时间**面板引擎**。替代 `@rc-component/picker`。
 *
 * - 契约文档：`docs/foundation/picker-contract.md`
 * - 面板层的归属由决策 `picker-panel-ownership` 裁决（**B：面板组件在本包**）⇒
 *   本包**产出 DOM 与 ARIA**，但仍**不产 CSS**（R4：引擎无视觉）。
 *   样式（`apollo-picker` 前缀下的 class 规则）由 `ui` 层的 DatePicker / TimePicker /
 *   Calendar 负责，本包只保证**类名结构与上游逐字一致**（由 L4 契约钉住）。
 * - ⚠️ 输入框（mask-format / 键盘字段导航）**不在本包边界内**（README 的 `notDo`）。
 *
 * 已实现 / 未实现的逐条清单见契约 §6.1 / §6.2 与 `README.md`。
 */

// ------------------------------------------------------------- 日期语义
export {
  fillTime,
  formatValue,
  getQuarter,
  getWeekNumber,
  getWeekStartDate,
  isInRange,
  isSame,
  isSameDate,
  isSameDecade,
  isSameMonth,
  isSameOrAfter,
  isSameQuarter,
  isSameTime,
  isSameTimestamp,
  isSameWeek,
  isSameYear,
  isWeekMode,
  WEEK_DAY_COUNT,
} from './date-util';

// ------------------------------------------------------- 日期库适配层
export { dayjsGenerateConfig } from './generate/dayjs';
// ------------------------------------------------- 键盘导航的数值部分
export type { MaskRange } from './keyboard';
export { getMaskRange, offsetCellValue } from './keyboard';
// ------------------------------------------------------ locale 的补齐
export { fillLocale, fillTimeFormat } from './locale-fill';
// ------------------------------------------------------------- 通用工具
export {
  fillIndex,
  getFromDate,
  getRowFormat,
  leftPad,
  pickProps,
  toArray,
} from './misc-util';
// ------------------------------------------------------- 面板几何与格子
export type { PanelCellsContext, PanelGeometry, PanelGeometryContext } from './panel';
export { buildPanelCells, getPanelGeometry, getRowStartDate } from './panel';
// ----------------------------------------------------- 区间选择的纯判定
export type { RangeSubmitInput, RangeValidateResult } from './range';
export {
  getEndDatePickerValue,
  isSameDates,
  isSamePanel,
  offsetPanelDate,
  orderDates,
  validateRangeSubmit,
} from './range';
// --------------------------------------------------------- 时间列校验
export type { TimeUnit } from './time-util';
export { findValidateTime } from './time-util';
// ------------------------------------------------- 多选的「切换一个值」
export { toggleDates } from './toggle-dates';

// ============================================================ 面板层
//
// 以下为「面板 Vue 组件」及其纯函数内核（裁决 `picker-panel-ownership` = B）。
// ⚠️ 组件**不产 CSS**；class 名结构与上游 `@rc-component/picker@1.12.2` 逐字一致。

export { DatePanel, WeekPanel } from './date-panel';
export { PanelBody } from './panel-body';
// ------------------------------------------------------- 上下文与类型
export type {
  PanelCellRender,
  PanelCellRenderInfo,
  PanelDateType,
  PanelHackContext,
  PanelInfo,
  PanelSemanticClassNames,
  PanelSemanticStyles,
  PanelSharedContext,
} from './panel-context';
export {
  hiddenStyleWhen,
  PANEL_HACK_KEY,
  PANEL_INFO_KEY,
  PANEL_SHARED_KEY,
  providePanelInfo,
  usePanelHack,
  usePanelInfo,
  usePanelShared,
} from './panel-context';
// ----------------------------------------------------------- 面板组件
export { DEFAULT_HEADER_ICONS, PanelHeader } from './panel-header';
// ------------------------------------------------ 面板表头的粒度与越界
export type {
  PanelHeaderDisabled,
  PanelHeaderLimitContext,
  PanelHeaderLimits,
} from './panel-header-limit';
export { getHeaderDisabled, getPanelHeaderLimits } from './panel-header-limit';
// ---------------------------------------------- 面板共用的 props 与辅助
export type { SharedPanelProps } from './panel-props';
export {
  formatWith,
  providePanelHack,
  providePanelInfoFromProps,
  sharedPanelProps,
} from './panel-props';
export { DEFAULT_PANEL_COMPONENTS, PickerPanel } from './picker-panel';
export type { TimeColumnType } from './time-column';
export { flattenUnits, TimeColumn } from './time-column';
// ------------------------------------------------ 时间面板的纯函数内核
export type {
  CustomFormat,
  DisabledTimes,
  FormatType,
  PickerFormat,
  TimeConfigShowTime,
  TimeConfigSource,
  TimePanelConfig,
} from './time-config';
export { fillShowTimeConfig, getTimeProps } from './time-config';
export { DateTimePanel, TimePanel } from './time-panel';
export { TimePanelBody } from './time-panel-body';
export type { MeridiemUnit, TimeParts, TimeTemplateInput } from './time-tmpl';
export {
  fillTimeUnitValue,
  getMeridiemTime,
  getMeridiemUnits,
  getNearestUnitIndex,
  getTimeParts,
  getTriggerDateTemplate,
  isAM,
} from './time-tmpl';
export type { TimeColumnUnit, TimeInfo } from './time-units';
export { generateUnits, getEnabled, getTimeInfo } from './time-units';
// ------------------------------------------------------------------ 类型
export type {
  DisabledDate,
  GenerateConfig,
  InternalMode,
  PanelCell,
  PanelMode,
  PickerLocale,
  PickerMode,
} from './types';
export { DecadePanel, MonthPanel, QuarterPanel, YearPanel } from './upper-panels';
