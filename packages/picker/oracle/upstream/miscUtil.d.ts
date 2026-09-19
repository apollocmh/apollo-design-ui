// 手写窄声明：只覆盖 oracle 实际调用的函数。见同目录 dateUtil.d.ts 的说明。
import type { PickerLocale, PanelMode } from '../../src/types';

export declare function leftPad(str: string | number, length: number, fill?: string): string;
export declare function toArray<T>(val: T | readonly T[] | null | undefined): T[];
export declare function fillIndex<T extends readonly unknown[]>(
  ori: T,
  index: number,
  value: T[number],
): T;
export declare function pickProps<T extends object>(
  props: T,
  keys?: readonly (keyof T)[],
): Partial<T>;

/** 上游声明的返回值是 FormatType 联合；oracle 只比对「有 format 时原样返回」这条，故收窄为 string。 */
export declare function getRowFormat(
  picker: PanelMode,
  locale: PickerLocale,
  format?: string,
): string;
export declare function getFromDate<DateType>(
  calendarValues: readonly Nullable<DateType>[],
  triggeredFields: readonly number[],
  activeIndex: number,
): DateType | undefined;

type Nullable<T> = T | null;
