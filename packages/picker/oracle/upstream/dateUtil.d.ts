// 手写窄声明：只覆盖 oracle 实际调用的函数。类型指向我们自己的 GenerateConfig，
// 有意不复制上游 .d.ts（它 import '../interface'，会拖进 React 类型）。
import type { GenerateConfig, PickerLocale, InternalMode } from '../../src/types';

/** 上游 `NullableDateType<DateType>` = `DateType | null`；测试还会传 `undefined`，一并收下。 */
type Nullable<T> = T | null | undefined;

export declare const WEEK_DAY_COUNT = 7;

export declare function isSameDecade<DateType>(
  generateConfig: GenerateConfig<DateType>,
  decade1: Nullable<DateType>,
  decade2: Nullable<DateType>,
): boolean;
export declare function isSameYear<DateType>(
  generateConfig: GenerateConfig<DateType>,
  year1: Nullable<DateType>,
  year2: Nullable<DateType>,
): boolean;
export declare function getQuarter<DateType>(
  generateConfig: GenerateConfig<DateType>,
  date: DateType,
): number;
export declare function isSameQuarter<DateType>(
  generateConfig: GenerateConfig<DateType>,
  quarter1: Nullable<DateType>,
  quarter2: Nullable<DateType>,
): boolean;
export declare function isSameMonth<DateType>(
  generateConfig: GenerateConfig<DateType>,
  month1: Nullable<DateType>,
  month2: Nullable<DateType>,
): boolean;
export declare function isSameDate<DateType>(
  generateConfig: GenerateConfig<DateType>,
  date1: Nullable<DateType>,
  date2: Nullable<DateType>,
): boolean;
export declare function isSameTime<DateType>(
  generateConfig: GenerateConfig<DateType>,
  time1: Nullable<DateType>,
  time2: Nullable<DateType>,
): boolean;
export declare function isSameTimestamp<DateType>(
  generateConfig: GenerateConfig<DateType>,
  time1: Nullable<DateType>,
  time2: Nullable<DateType>,
): boolean;
export declare function isSameWeek<DateType>(
  generateConfig: GenerateConfig<DateType>,
  locale: string,
  date1: Nullable<DateType>,
  date2: Nullable<DateType>,
): boolean;
export declare function isSame<DateType>(
  generateConfig: GenerateConfig<DateType>,
  locale: PickerLocale,
  source: Nullable<DateType>,
  target: Nullable<DateType>,
  type: InternalMode,
): boolean;
export declare function isInRange<DateType>(
  generateConfig: GenerateConfig<DateType>,
  startDate: Nullable<DateType>,
  endDate: Nullable<DateType>,
  current: Nullable<DateType>,
): boolean;
export declare function isSameOrAfter<DateType>(
  generateConfig: GenerateConfig<DateType>,
  locale: PickerLocale,
  date1: Nullable<DateType>,
  date2: Nullable<DateType>,
  type: InternalMode,
): boolean;
export declare function getWeekStartDate<DateType>(
  locale: string,
  generateConfig: GenerateConfig<DateType>,
  value: DateType,
): DateType;
export declare function formatValue<DateType>(
  value: Nullable<DateType>,
  options: {
    generateConfig: GenerateConfig<DateType>;
    locale: PickerLocale;
    format: string | ((value: DateType) => string);
  },
): string;
export declare function fillTime<DateType>(
  generateConfig: GenerateConfig<DateType>,
  date: DateType,
  time?: DateType,
): DateType;
