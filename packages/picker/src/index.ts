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

// ------------------------------------------------------------------ 类型
export type {
  PanelMode,
  InternalMode,
  PickerMode,
  GenerateConfig,
  PickerLocale,
  DisabledDate,
  PanelCell,
} from './types';

// ------------------------------------------------------- 日期库适配层
export { dayjsGenerateConfig } from './generate/dayjs';

// ------------------------------------------------------------- 日期语义
export {
  WEEK_DAY_COUNT,
  isSameDecade,
  isSameYear,
  getQuarter,
  isSameQuarter,
  isSameMonth,
  isSameDate,
  isSameTime,
  isSameTimestamp,
  isSameWeek,
  isSame,
  isInRange,
  isSameOrAfter,
  getWeekStartDate,
  formatValue,
  fillTime,
  getWeekNumber,
  isWeekMode,
} from './date-util';

// ------------------------------------------------------------- 通用工具
export {
  leftPad,
  toArray,
  fillIndex,
  pickProps,
  getRowFormat,
  getFromDate,
} from './misc-util';

// ------------------------------------------------------- 面板几何与格子
export type {
  PanelGeometry,
  PanelGeometryContext,
  PanelCellsContext,
} from './panel';
export { getPanelGeometry, getRowStartDate, buildPanelCells } from './panel';

// ----------------------------------------------------- 区间选择的纯判定
export type { RangeSubmitInput, RangeValidateResult } from './range';
export { orderDates, isSameDates, validateRangeSubmit } from './range';

// ------------------------------------------------- 键盘导航的数值部分
export type { MaskRange } from './keyboard';
export { getMaskRange, offsetCellValue } from './keyboard';

// --------------------------------------------------------- 时间列校验
export type { TimeUnit } from './time-util';
export { findValidateTime } from './time-util';
