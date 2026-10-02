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

/** TimePicker 组件。注册名 `ATimePicker`（COMPONENT-RULES.md 规则 R2）。 */
export const TimePicker = withInstall(TimePickerComponent);

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
