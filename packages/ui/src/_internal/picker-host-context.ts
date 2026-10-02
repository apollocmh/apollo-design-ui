/**
 * **Picker 宿主上下文** —— 让「薄壳组件」把 `DatePicker` / `RangePicker` 的
 * 「配置键」与「告警命名空间」改道。
 *
 * ── 为什么需要它（time-picker 的 G1 实测，见 `docs/analysis/time-picker.md` §4.2）──
 *
 * antd 的 `TimePicker` 是 `DatePicker` 的薄壳，但内层读的**不是** `datePicker` 那份
 * `ConfigProvider` 配置：
 *
 * ```js
 * // generateSinglePicker.tsx:50 —— 判据是「哪个入口组件」，不是「哪个 picker 模式」
 * const pickerType = displayName === TIMEPICKER ? 'timePicker' : 'datePicker';
 * ```
 *
 * ⇒ 三条实测结论（`node tests/visual/debug/probe-time-picker-antd.mjs` 可复现）：
 *
 * | 场景 | antd 根类名 |
 * |---|---|
 * | `timePicker.classNames.root='ctx-root'` + `<TimePicker/>` | `… ctx-root ctx-root`（**两次**） |
 * | `datePicker.classNames.root='dp-root'` + `<TimePicker/>` | **不出现** `dp-root` |
 * | `timePicker.classNames.root='ctx-root'` + `<DatePicker picker="time"/>` | **不出现** |
 * | `datePicker.classNames.root='dp-root'` + `<DatePicker picker="time"/>` | `… dp-root` |
 *
 * 本仓的 `DatePicker.vue` / `RangePicker.vue` **硬编码** `useComponentConfig('datePicker')`
 * ⇒ 若 `TimePicker.vue` 只是「合并后当 props 传下去」，`components.datePicker.*` 会
 * **泄漏**进 TimePicker（antd 不泄漏）⇒ 那是 **BUG**，不是「平台差异」。
 *
 * ── 为什么用 `provide/inject` 而不是加一个 prop ──────────────────────────────
 *
 * ① 这是**实现细节**，不该出现在 `DatePickerProps` 的公开面上（H10 之外的「API 污染」）；
 * ② `TimePicker.vue` 是 `DatePicker.vue` 的**直接父组件** ⇒ 不存在「中间层自己 provide
 *    同族键」的遮蔽问题（那是 PITFALLS 256 的形态，这里没有中间层）；
 * ③ 与 `steps/context.ts` 同一先例（内部 `InjectionKey`，不进 props）。
 *
 * ── 告警命名空间为什么也要一起改 ─────────────────────────────────────────────
 *
 * 实测：`<TimePicker onSelect={fn}/>` 报 **`[antd: TimePicker]`**，而
 * `<DatePicker onSelect={fn}/>` 报 `[antd: DatePicker]` —— 命名空间取自**内层**的
 * `displayName`，而 `onSelect` 是在 `restProps` 里透传给内层的。
 * 本仓 `DatePicker.vue` 的 `useDevWarning('DatePicker')` 是硬编码的
 * ⇒ 必须一并从注入值取，否则 TimePicker 的告警会带错前缀。
 *
 * ⚠️ `RangePicker` 侧的命名空间**恒为** `'DatePicker.RangePicker'`（实测：
 * `TimePicker.RangePicker` 的告警也是这个前缀）—— 它只需要改 `configKey`。
 */

import type { InjectionKey } from 'vue';

/** 宿主上下文：两个**可选**覆盖项（未覆盖时各组件用自己的默认值）。 */
export interface PickerHostContext {
  /**
   * `ConfigProvider` 的组件级配置键 ⇒ `useComponentConfig(configKey)`。
   *
   * 默认：`DatePicker.vue` / `RangePicker.vue` 都是 `'datePicker'`；
   * `TimePicker.vue` / `TimeRangePicker.vue` 覆盖成 `'timePicker'`。
   */
  configKey?: string;
  /**
   * `useDevWarning` 的命名空间（`[apollo: <warningName>]` 里的那一段）。
   *
   * 默认：`DatePicker.vue` 是 `'DatePicker'`、`RangePicker.vue` 是 `'DatePicker.RangePicker'`；
   * `TimePicker.vue` 覆盖成 `'TimePicker'`（**单个** TimePicker 的告警前缀）；
   * `TimeRangePicker.vue` **不覆盖**（恒 `'DatePicker.RangePicker'`）。
   */
  warningName?: string;
}

/**
 * 注入键。
 *
 * ⚠️ 名字里带 `internal` 的语义（不进公开 API）由**文件位置**（`_internal/`）表达，
 * 这里不再加前缀 —— 与 `steps/context.ts` 的 `stepsInternalContextKey` 同一约定。
 */
export const pickerHostContextKey: InjectionKey<PickerHostContext> = Symbol(
  'apollo-picker-host-context',
);
