/**
 * @apollo-design/picker
 *
 * 日期/时间面板引擎。替代 `@rc-component/picker`（**只替代其中可纯函数化的部分**）。
 *
 * - 契约文档：`docs/foundation/picker-contract.md`
 * - ⚠️ 本包**不导出任何 Vue 组件**（R4：引擎无视觉）。面板 DOM / class / 样式由
 *   `packages/ui/src/{date-picker,time-picker}` 消费这里的**状态位**渲染。
 * - ⚠️ 输入框不在本包边界内（README 的 `notDo`）。
 *
 * 已实现 / 未实现的逐条清单见契约 §6.1 / §6.2。
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
export type {
  PanelCellsContext,
  PanelGeometry,
  PanelGeometryContext,
} from './panel';
export { buildPanelCells, getPanelGeometry, getRowStartDate } from './panel';
// ----------------------------------------------------- 区间选择的纯判定
export type { RangeSubmitInput, RangeValidateResult } from './range';
export { isSameDates, orderDates, validateRangeSubmit } from './range';
// --------------------------------------------------------- 时间列校验
export type { TimeUnit } from './time-util';
export { findValidateTime } from './time-util';
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
