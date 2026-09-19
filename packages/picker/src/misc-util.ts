/**
 * 通用工具层。
 *
 * 与 `@rc-component/picker@1.12.2` 的 `es/utils/miscUtil.js` **逐位对拍**
 * （`src/__tests__/misc-util.oracle.test.ts`）。
 *
 * ⚠️ `toArray` 与 `@apollo-design/utils` 的 `toArray` **同名不同义**：
 * 后者是为 Vue children 设计的（会展平 vnode、拆 Fragment），这里是「包成数组」。
 * 不要互相复用（PITFALLS 70 的同源教训）。
 */

import type { PickerLocale, PickerMode } from './types';

/** 补到 `length`；**超过 length 不截断**。 */
export function leftPad(str: string | number, length: number, fill = '0'): string {
  let current = String(str);
  while (current.length < length) {
    current = `${fill}${current}`;
  }
  return current;
}

/** `null` / `undefined` ⇒ `[]`；数组原样返回（**不拷贝**）；其余包成数组。 */
export function toArray<T>(val: T | T[] | null | undefined): T[] {
  if (val === null || val === undefined) {
    return [];
  }
  return Array.isArray(val) ? val : [val];
}

/** 浅拷贝一份数组再写 `index`。 */
export function fillIndex<T>(ori: readonly T[], index: number, value: T): T[] {
  const clone = [...ori];
  clone[index] = value;
  return clone;
}

/** 按 `keys` 取值；`keys` 省略 ⇒ 取全部；**过滤掉值为 `undefined` 的键**。 */
export function pickProps<T extends object>(props: T, keys?: readonly (keyof T)[]): Partial<T> {
  const clone: Partial<T> = {};
  const mergedKeys = keys ?? (Object.keys(props) as (keyof T)[]);
  mergedKeys.forEach((key) => {
    if (props[key] !== undefined) {
      clone[key] = props[key];
    }
  });
  return clone;
}

/**
 * 该 picker 的默认输入格式。
 *
 * `format` 优先；否则按 picker 取 `locale.fieldXxxFormat`。
 * ⚠️ 返回 `undefined` 是**合法结果** —— locale 里这些键全是可选的。
 */
export function getRowFormat(
  picker: PickerMode,
  locale: PickerLocale,
  format?: string,
): string | undefined {
  if (format) {
    return format;
  }
  switch (picker) {
    case 'time':
      return locale.fieldTimeFormat;
    case 'month':
      return locale.fieldMonthFormat;
    case 'year':
      return locale.fieldYearFormat;
    case 'quarter':
      return locale.fieldQuarterFormat;
    case 'week':
      return locale.fieldWeekFormat;
    default:
      return locale.fieldDateFormat;
  }
}

/**
 * 区间选择里「另一个槽位」的当前值（用于 `disabledDate` 的 `info.from`）。
 *
 * `triggeredFields` 里第一个**有值**的索引就是它；若它恰好是 `activeIndex` ⇒ `undefined`
 * （自己不能作为自己的参照）。
 */
export function getFromDate<DateType>(
  calendarValues: readonly (DateType | null | undefined)[],
  triggeredFields: readonly number[],
  activeIndex: number,
): DateType | null | undefined {
  const firstValuedIndex = triggeredFields.find((index) => calendarValues[index]);
  if (firstValuedIndex === undefined) {
    return undefined;
  }
  return activeIndex !== firstValuedIndex ? calendarValues[firstValuedIndex] : undefined;
}
