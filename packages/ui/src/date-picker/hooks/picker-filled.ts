/**
 * locale 的**补齐**与 `showTime` 的归一（G4 · S2）。
 *
 * 契约来源：`@rc-component/picker@1.12.2` 的
 * `es/PickerInput/hooks/useFilledProps.js:72-76` + `es/hooks/useLocale.js:31-83`
 * （**重新定义**，不搬运实现，H2）。
 *
 * ── 这一段解决什么（它曾经是一个**阻塞级**缺口）────────────────────────────────
 *
 * 上游的字段格式串有**两层来源**，缺任何一层都会让键入解析恒失败：
 *
 * ```
 * props.format（用户给的）
 *   ↓ 都没有时
 * locale.fieldXxxFormat（语言包给的）        ← getRowFormat 读的就是它
 *   ↓ 语言包里也没有时
 * rc 的 fillLocale 补的硬编码兜底            ← 🚨 本仓此前缺的是**这一层**
 * ```
 *
 * 实测事实（2026-09-30 / 2026-10-01 两轮）：
 *
 * | 事实 | 证据 |
 * |---|---|
 * | 本仓 `en_US` 的 `DatePicker.lang` **没有** `fieldDateFormat` | `packages/locale/src/locales/en_US.ts` |
 * | **antd 的 `locale.lang` 也没有**（`field*` 键为空） | `Object.keys(antd 的 en_US.lang).filter(k => k.startsWith('field'))` ⇒ `[]` |
 * | 所以默认格式**不可能**来自语言包 | 上两条 |
 * | 它来自 rc 的 `useLocale` → `fillLocale`（`fieldDateFormat \|\| 'YYYY-MM-DD'`） | `es/hooks/useLocale.js:59` |
 *
 * ⇒ 症状：`props.format` 未传时 `formatList` 恒为 `[]` ⇒ 键入**任何**内容都判非法
 * （`aria-invalid` 恒 `true`）。**S1 的 L4 抓不到它** —— `valueTexts` 走
 * `firstFormat ?? ''` 兜底、`formatValue` 对空格式串有默认 ⇒ 显示照常。
 * 即「显示对」≠「功能对」，只有键入才暴露（PITFALLS 234）。
 *
 * ── 三条必须照抄的判据 ──────────────────────────────────────────────────────
 *
 * 1. **补齐用的时间格式是「从 4 个 show 标志推出来的」，不是 `showTime.format`** ——
 *    上游 `useLocale(locale, localeTimeProps)` 收的是 `getTimeProps` 的第二项，
 *    里面只有 `showHour/showMinute/showSecond/showMillisecond/use12Hours`，
 *    补出来的 `timeFormat` 是 `fillTimeFormat(...)`（`useLocale.js:55`）。
 *    ⚠️ 直觉会写成 `showTime.format` —— 那是**错的**（`showTime={{ format }}` 只决定
 *    面板列，不决定字段串）。
 * 2. **顺序**：先补 locale（要 `localeTimeProps`），**再**算 `mergedShowTime`
 *    （它的 `baselineFormat` 要读**已补齐**的 locale；`time-config.ts:331` 的
 *    `getRowFormat` 读不到会退化成空串）。
 * 3. `mergedShowTime` 只在 `datetime` / `time` 下非空（其余返回 `null`）——
 *    这是 `fillShowTimeConfig` 的契约，不是本文件的判断。
 *
 * ── 与「面板自己也会补」的关系（为什么两边不冲突）──────────────────────────────
 *
 * `@apollo-design/picker` 的 `PickerPanel` 在**独立使用**时也会补一次
 * （`picker-panel.ts:244`，裁决 `picker-panel-ownership` = B 的必然结果）。
 * 本文件补出来的 locale 传给面板后，面板那次 `fillLocale` 的判据是 `||`
 * ⇒ **已补齐的键不会被覆盖**，两次补齐等价、不会互相打架。
 */

import {
  fillLocale,
  fillShowTimeConfig,
  fillTimeFormat,
  getTimeProps,
  type InternalMode,
  type PanelDateType,
  type PickerLocale as RcPickerLocale,
  type TimeConfigSource,
  type TimePanelConfig,
} from '@apollo-design/picker';
import { type ComputedRef, computed } from 'vue';

/**
 * 上游 `useLocale`（去掉 `useMemo` 那层壳后的纯函数）。
 *
 * 第二参是 `getTimeProps` 的**第二项**（`localeTimeProps`）——
 * 它带着收敛后的 4 个 show 标志，补齐用的时间格式由它们推出（见文件头判据 1）。
 */
export function fillPickerLocale(
  locale: RcPickerLocale,
  localeTimeProps: TimePanelConfig<PanelDateType>,
): RcPickerLocale {
  const { showHour, showMinute, showSecond, showMillisecond, use12Hours } = localeTimeProps;
  return fillLocale(
    locale,
    fillTimeFormat(showHour, showMinute, showSecond, showMillisecond, use12Hours),
  );
}

export interface UseFilledLocaleOptions {
  /**
   * `getTimeProps` 的入参（组件 props 的**超集**）。
   *
   * ⚠️ 只放「`getTimeProps` 会读、且本组件声明了」的键。
   * 顶层的时间 props（`showHour` / `hourStep` / `use12Hours` …）**不在
   * `DatePickerProps` 上** —— antd 的 `DatePicker` 也不声明它们
   * （`InjectDefaultProps<RcPickerProps>` 不含 `SharedTimeProps`），
   * 它们只在 `showTime` 对象里 ⇒ 这里刻意不展开。
   */
  source: ComputedRef<TimeConfigSource<PanelDateType>>;
  /** 合并后**未补齐**的 rc locale（`mergePickerLocale(...).lang`）。 */
  locale: ComputedRef<RcPickerLocale>;
  /** 内部模式（`toInternalMode`）。 */
  internalMode: ComputedRef<InternalMode>;
}

export interface FilledLocaleResult {
  /** 已补齐的 rc locale（面板 / `getRowFormat` / `formatValue` 都该用它）。 */
  filledLocale: ComputedRef<RcPickerLocale>;
  /**
   * 归一的 `showTime`；非 `datetime` / `time` 时为 `null`。
   *
   * ⚠️ **当前没有消费者**（2026-10-01）—— 刻意保留，不是漏接：
   *   - 上游把它塞进 `filledProps.showTime` 交给**同一个包**里的 `PickerInput`；
   *   - 本仓的面板在 `@apollo-design/picker` 里（裁决 `picker-panel-ownership` = B），
   *     它**自己**会跑一遍 `getTimeProps` + `fillShowTimeConfig`（`picker-panel.ts:239-260`）
   *     ⇒ 再把本函数的产物传下去是**重复归一**，两份真值来源反而更容易漂移。
   *   - 保留它的理由是**顺序**：`filledLocale` 是这条链的中间产物，
   *     而 `mergedShowTime` 正是「顺序不可颠倒」的那一步（见文件头判据 2）——
   *     留着它，S4（字段导航）与 S5（`multiple` / `presets`）要接
   *     `showTime` 时不必重新推一遍依赖关系。
   *   - 若到 S5 收口时仍无消费者，应当**删掉**它（而不是留着当摆设）。
   */
  mergedShowTime: ComputedRef<TimePanelConfig<PanelDateType> | null>;
}

/**
 * 上游 `useFilledProps` 的 `Locale` + `ShowTime` 两段（`useFilledProps.js:72-76`）。
 *
 * 依赖关系（**顺序不可颠倒**，见文件头判据 2）：
 * `source` → `localeTimeProps` → `filledLocale` → `mergedShowTime`
 */
export function useFilledLocale(options: UseFilledLocaleOptions): FilledLocaleResult {
  const timeConfig = computed(() => getTimeProps<PanelDateType>(options.source.value));

  const filledLocale = computed(() => fillPickerLocale(options.locale.value, timeConfig.value[1]));

  const mergedShowTime = computed(() =>
    fillShowTimeConfig(
      options.internalMode.value,
      // ① showTime.format
      timeConfig.value[2],
      // ② props.format 的单串形态
      timeConfig.value[3],
      // ③ 合并后的时间配置
      timeConfig.value[0],
      // ④ 已补齐的 locale（`baselineFormat` 从它取）
      filledLocale.value,
    ),
  );

  return { filledLocale, mergedShowTime };
}
