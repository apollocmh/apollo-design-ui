/** Public TimePicker entries and current Vue contracts; no internal PurePanel entry. */

import { withInstall } from '../_internal/with-install';
import TimePickerComponent from './TimePicker.vue';
import TimeRangePickerComponent from './TimeRangePicker.vue';

/** TimePicker 组件。注册名 `ATimePicker`（COMPONENT-RULES.md 规则 R2）。 */
export const TimePicker = withInstall(TimePickerComponent);
/** `TimePicker.RangePicker` 的具名形态。注册名 `ATimeRangePicker`。 */
export const TimeRangePicker = withInstall(TimeRangePickerComponent);

/**
 * 上游的静态别名 `TimePicker.RangePicker`（`es/time-picker/index.js` 的
 * `Object.assign` 挂载）—— Vue 侧没有「函数组件带静态属性」的等价物，
 * 但**消费习惯**要兼容（antd 用户写 `<TimePicker.RangePicker />`）。
 *
 * ⚠️ `Object.assign` 是**原地**修改 ⇒ `TimePicker` 自己也带上了 `RangePicker`；
 * 返回值额外把类型带上（直接赋值需要 `as any`，H10 禁止）。
 * ⇒ 两种用法都成立：`TimePicker.RangePicker`（类型可见）与具名 `TimeRangePicker`。
 * 与 `date-picker/index.ts` 的 `DatePickerWithRange` 同判。
 */
export const TimePickerWithRange = Object.assign(TimePicker, { RangePicker: TimeRangePicker });

export default TimePicker;

// Public contracts.
export type {
  TimeNoUndefinedRangeValue,
  TimePickerCellRenderInfo,
  TimePickerEmits,
  TimePickerExpose,
  TimePickerLocale,
  TimePickerPopupSemanticClassNames,
  TimePickerPopupSemanticStyles,
  TimePickerProps,
  TimePickerSemanticClassNames,
  TimePickerSemanticStyles,
  TimePickerSemanticValue,
  TimePickerSlots,
  TimePickerValue,
  TimePickerValueDate,
  TimeRangePickerEmits,
  TimeRangePickerExpose,
  TimeRangePickerProps,
  TimeRangePickerSlots,
  TimeRangeValue,
  TimeRangeValueDate,
} from './interface';

// TimePicker reuses DatePicker styles and has no independent Component Token.
