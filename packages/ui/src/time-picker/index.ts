/**
 * TimePicker 的公共导出。
 *
 * 与 antd 的 `es/time-picker/index.js` 对齐的对外面。
 *
 * ── 上游的对外面（`index.d.ts` 末尾）──────────────────────────────────────────
 *
 * ```ts
 * type MergedTimePicker = typeof TimePicker & {
 *   RangePicker: typeof RangePicker;
 *   _InternalPanelDoNotUseOrYouWillBeFired: typeof PurePanel;
 * };
 * ```
 *
 * ⇒ 三个成员：`TimePicker`、`TimePicker.RangePicker`、`_InternalPanel…`。
 * 第三个**本仓未落地**（`genPurePanel` 无对应物，与 date-picker 同判）
 * ⇒ 缺口登记在 `README.md` §5，不在这里造一个假的。
 */

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

// ---------------------------------------------------------------- 类型（G2 产物）
// ⚠️ 与 `date-picker/index.ts` 同一取舍：**类型面不裁剪** —— 含全部 deprecated 字段。
//    裁剪会让迁移时「类型过了但运行时没实现」，比多几个 `@deprecated` 更危险。
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------- 样式
// 🚨 **本组件没有 `style/`** —— antd 的 `es/time-picker/` 里没有一句样式代码
//    （`es/time-picker/index.js` 71 行里零 `import style`；`components/time-picker/`
//    下没有 `style/` 目录）⇒ 观感 100% 来自 `date-picker` 的 `-picker-*` 样式。
//    `tokenStatus` / `styleStatus` 在 registry 里置 **`n/a`** + `layerNotes` 写依据，
//    照 `watermark` 先例。⇒ **这里没有 `genTimePickerStyle` 可导出**，这是**判据**不是遗漏。
