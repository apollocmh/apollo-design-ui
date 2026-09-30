/**
 * locale 合并与 placeholder 解析（G4 · S1）。
 *
 * 契约来源：antd 6.6.4 `es/date-picker/util.js` 的 `getPlaceholder` /
 * `getRangePlaceholder`（**重新定义**，不搬运实现，H2）+ `generateSinglePicker.js`
 * 的 locale 归一（`merge(contextLocale, props.locale || {})`）。
 *
 * ── 两处判据（逐字来自上游，写错会静默走错分支）────────────────────────────────
 *
 * 1. **六个分支的优先序**，且每一支都带「该字段存在」的判据 ⇒
 *    **locale 缺字段时会继续往下落**（RangePicker 有专门测试：
 *    `should fall back to rangePlaceholder when locale omits range-variant placeholder`）。
 * 2. **范围版与单值版的差异**：范围用 `range*Placeholder`，`time` 用
 *    `timePickerLocale.rangePlaceholder`（**不是** `lang` 里的）。
 *
 * ⚠️ 上游 `isNonNullable(customizePlaceholder)` —— 判据是「非 null 非 undefined」，
 * 所以 `placeholder=""`（空串）**也算给了**（不会落到 locale）。这与「truthy 判据」
 * 不同，是常见写错点。
 */

import type { PickerLocale } from '@apollo-design/locale';
import { merge } from '@apollo-design/utils';
import type { DatePickerMode } from '../interface';

/** `isNonNullable`（上游 `@rc-component/util` 的同名函数）。 */
function isNonNullable<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 合并上下文 locale 与组件自己的 `locale` prop。
 *
 * 上游：`merge(contextLocale, props.locale ?? {})` —— **后者覆盖前者**，
 * 且是**深合并**（`@rc-component/util` 的 `merge`；本仓 `utils` 的 `merge` 同语义）。
 *
 * ⚠️ 上游还有一条「深合并 locale 的 partial 字段」的测试
 * （`should support deep merge locale with partial fields`）—— 深合并是**契约**，
 * 不能退化成浅合并。
 */
export function mergePickerLocale(
  contextLocale: PickerLocale | undefined,
  propLocale: PickerLocale | undefined,
): PickerLocale {
  const merged = merge<PickerLocale>(
    (contextLocale ?? {}) as PickerLocale,
    (propLocale ?? {}) as PickerLocale,
  );
  return merged;
}

/**
 * 单值的 placeholder（逐字对齐上游 `getPlaceholder`）。
 *
 * 优先序：自定义 ⇒ `yearPlaceholder` ⇒ `quarterPlaceholder` ⇒ `monthPlaceholder`
 * ⇒ `weekPlaceholder` ⇒ `time` 用 `timePickerLocale.placeholder` ⇒ 兜底 `lang.placeholder`。
 */
export function getPlaceholder(
  locale: PickerLocale,
  picker: DatePickerMode | undefined,
  customizePlaceholder?: string,
): string | undefined {
  if (isNonNullable(customizePlaceholder)) {
    return customizePlaceholder;
  }
  if (picker === 'year' && locale.lang.yearPlaceholder) {
    return locale.lang.yearPlaceholder;
  }
  if (picker === 'quarter' && locale.lang.quarterPlaceholder) {
    return locale.lang.quarterPlaceholder;
  }
  if (picker === 'month' && locale.lang.monthPlaceholder) {
    return locale.lang.monthPlaceholder;
  }
  if (picker === 'week' && locale.lang.weekPlaceholder) {
    return locale.lang.weekPlaceholder;
  }
  if (picker === 'time' && locale.timePickerLocale.placeholder) {
    return locale.timePickerLocale.placeholder;
  }
  return locale.lang.placeholder;
}

/**
 * 范围的 placeholder（逐字对齐上游 `getRangePlaceholder`）。
 *
 * ⚠️ 返回 `[string, string]` —— 但**每一端都可能落到 `lang.rangePlaceholder`**
 * （它本身是元组），所以返回类型是元组而不是 `string | undefined`。
 */
export function getRangePlaceholder(
  locale: PickerLocale,
  picker: DatePickerMode | undefined,
  customizePlaceholder?: [string, string],
): [string, string] | undefined {
  if (isNonNullable(customizePlaceholder)) {
    return customizePlaceholder;
  }
  if (picker === 'year' && locale.lang.rangeYearPlaceholder) {
    return locale.lang.rangeYearPlaceholder;
  }
  if (picker === 'quarter' && locale.lang.rangeQuarterPlaceholder) {
    return locale.lang.rangeQuarterPlaceholder;
  }
  if (picker === 'month' && locale.lang.rangeMonthPlaceholder) {
    return locale.lang.rangeMonthPlaceholder;
  }
  if (picker === 'week' && locale.lang.rangeWeekPlaceholder) {
    return locale.lang.rangeWeekPlaceholder;
  }
  if (picker === 'time' && locale.timePickerLocale.rangePlaceholder) {
    return locale.timePickerLocale.rangePlaceholder;
  }
  return locale.lang.rangePlaceholder;
}
