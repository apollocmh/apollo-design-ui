/**
 * 日期语义层。
 *
 * 与 `@rc-component/picker@1.12.2` 的 `es/utils/dateUtil.js` **逐位对拍**
 * （`src/__tests__/date-util.oracle.test.ts`，契约 §4.2）。
 *
 * ⚠️ 两处**照抄上游的不对称**（契约 §5.3）：
 *   1. `isSameWeek` 收**裸字符串** locale，而 `isSame` / `isSameOrAfter` 收
 *      `PickerLocale` 对象 —— 这是上游的真实形态，改对称会让 call site 全错；
 *   2. `getWeekStartDate` 的参数顺序是 `(locale, generateConfig, value)`，
 *      与同文件其它函数相反。
 */

import type { GenerateConfig, InternalMode, PanelMode, PickerLocale } from './types';

export const WEEK_DAY_COUNT = 7;

/**
 * 空值比较的公共前缀（上游 `nullableCompare`）：
 * ① 两边都空 ⇒ `true`；② 引用相等 ⇒ `true`；③ 只有一边空 ⇒ `false`；
 * ④ 否则交给 `compare`。
 *
 * 把已收窄的两个值**传给** `compare` 而不是靠闭包捕获，是为了让类型系统知道
 * 它们非空 —— 否则调用方要写一堆 `as DateType`（H10）。
 */
function nullableCompare<DateType>(
  value1: DateType | null | undefined,
  value2: DateType | null | undefined,
  compare: (v1: DateType, v2: DateType) => boolean,
): boolean {
  if ((!value1 && !value2) || value1 === value2) {
    return true;
  }
  if (!value1 || !value2) {
    return false;
  }
  return compare(value1, value2);
}

export function isSameDecade<DateType>(
  generateConfig: GenerateConfig<DateType>,
  decade1: DateType | null | undefined,
  decade2: DateType | null | undefined,
): boolean {
  return nullableCompare(decade1, decade2, (v1, v2) => {
    const num1 = Math.floor(generateConfig.getYear(v1) / 10);
    const num2 = Math.floor(generateConfig.getYear(v2) / 10);
    return num1 === num2;
  });
}

export function isSameYear<DateType>(
  generateConfig: GenerateConfig<DateType>,
  year1: DateType | null | undefined,
  year2: DateType | null | undefined,
): boolean {
  return nullableCompare(
    year1,
    year2,
    (v1, v2) => generateConfig.getYear(v1) === generateConfig.getYear(v2),
  );
}

/** 季度 = `floor(月份 / 3) + 1`。月份是 0-based。 */
export function getQuarter<DateType>(
  generateConfig: GenerateConfig<DateType>,
  date: DateType,
): number {
  return Math.floor(generateConfig.getMonth(date) / 3) + 1;
}

export function isSameQuarter<DateType>(
  generateConfig: GenerateConfig<DateType>,
  quarter1: DateType | null | undefined,
  quarter2: DateType | null | undefined,
): boolean {
  return nullableCompare(
    quarter1,
    quarter2,
    (v1, v2) =>
      isSameYear(generateConfig, v1, v2) &&
      getQuarter(generateConfig, v1) === getQuarter(generateConfig, v2),
  );
}

export function isSameMonth<DateType>(
  generateConfig: GenerateConfig<DateType>,
  month1: DateType | null | undefined,
  month2: DateType | null | undefined,
): boolean {
  return nullableCompare(
    month1,
    month2,
    (v1, v2) =>
      isSameYear(generateConfig, v1, v2) &&
      generateConfig.getMonth(v1) === generateConfig.getMonth(v2),
  );
}

export function isSameDate<DateType>(
  generateConfig: GenerateConfig<DateType>,
  date1: DateType | null | undefined,
  date2: DateType | null | undefined,
): boolean {
  return nullableCompare(
    date1,
    date2,
    (v1, v2) =>
      isSameYear(generateConfig, v1, v2) &&
      isSameMonth(generateConfig, v1, v2) &&
      generateConfig.getDate(v1) === generateConfig.getDate(v2),
  );
}

export function isSameTime<DateType>(
  generateConfig: GenerateConfig<DateType>,
  time1: DateType | null | undefined,
  time2: DateType | null | undefined,
): boolean {
  return nullableCompare(
    time1,
    time2,
    (v1, v2) =>
      generateConfig.getHour(v1) === generateConfig.getHour(v2) &&
      generateConfig.getMinute(v1) === generateConfig.getMinute(v2) &&
      generateConfig.getSecond(v1) === generateConfig.getSecond(v2),
  );
}

/** 年月日 + 时分秒 + 毫秒全部相同。 */
export function isSameTimestamp<DateType>(
  generateConfig: GenerateConfig<DateType>,
  time1: DateType | null | undefined,
  time2: DateType | null | undefined,
): boolean {
  return nullableCompare(
    time1,
    time2,
    (v1, v2) =>
      isSameDate(generateConfig, v1, v2) &&
      isSameTime(generateConfig, v1, v2) &&
      generateConfig.getMillisecond(v1) === generateConfig.getMillisecond(v2),
  );
}

/**
 * 同一周：先比较**周起始日是否同年**，再比较周序号。
 *
 * ⚠️ 年判据用 `isSameYear`（只比年份），不是「同一天」—— 跨年周（1 月 1 号那周）
 * 会因为这个判据被拆成两年。这是上游形态，照抄。
 */
export function isSameWeek<DateType>(
  generateConfig: GenerateConfig<DateType>,
  locale: string,
  date1: DateType | null | undefined,
  date2: DateType | null | undefined,
): boolean {
  return nullableCompare(date1, date2, (v1, v2) => {
    const weekStartDate1 = generateConfig.locale.getWeekFirstDate(locale, v1);
    const weekStartDate2 = generateConfig.locale.getWeekFirstDate(locale, v2);
    return (
      isSameYear(generateConfig, weekStartDate1, weekStartDate2) &&
      generateConfig.locale.getWeek(locale, v1) === generateConfig.locale.getWeek(locale, v2)
    );
  });
}

/**
 * 按面板粒度比较。
 *
 * ⚠️ 参数类型是 `InternalMode`：`'datetime'`（以及任何未列出的值）落到
 * **default 分支 = `isSameTimestamp`**。收窄成 `PanelMode` 会让这条分支不可达。
 */
export function isSame<DateType>(
  generateConfig: GenerateConfig<DateType>,
  locale: PickerLocale,
  source: DateType | null | undefined,
  target: DateType | null | undefined,
  type: InternalMode,
): boolean {
  switch (type) {
    case 'date':
      return isSameDate(generateConfig, source, target);
    case 'week':
      return isSameWeek(generateConfig, locale.locale, source, target);
    case 'month':
      return isSameMonth(generateConfig, source, target);
    case 'quarter':
      return isSameQuarter(generateConfig, source, target);
    case 'year':
      return isSameYear(generateConfig, source, target);
    case 'decade':
      return isSameDecade(generateConfig, source, target);
    case 'time':
      return isSameTime(generateConfig, source, target);
    default:
      return isSameTimestamp(generateConfig, source, target);
  }
}

/**
 * **开区间**：`startDate < current < endDate`。
 * 任一参数为空 ⇒ `false`（不是「不限制」）。
 */
export function isInRange<DateType>(
  generateConfig: GenerateConfig<DateType>,
  startDate: DateType | null | undefined,
  endDate: DateType | null | undefined,
  current: DateType | null | undefined,
): boolean {
  if (!startDate || !endDate || !current) {
    return false;
  }
  return generateConfig.isAfter(current, startDate) && generateConfig.isAfter(endDate, current);
}

/** 同粒度相等 **或** 严格晚于。粒度是 `type`，不是时刻。 */
export function isSameOrAfter<DateType>(
  generateConfig: GenerateConfig<DateType>,
  locale: PickerLocale,
  date1: DateType | null | undefined,
  date2: DateType | null | undefined,
  type: InternalMode,
): boolean {
  if (isSame(generateConfig, locale, date1, date2, type)) {
    return true;
  }
  // ⚠️ 上游在这一行**没有**空值保护：`isSame` 返回 false 后直接 `isAfter(null, …)` 会抛。
  // 我们照抄 —— `PanelHeader` 的四个调用点都有 `!minDate` / `!maxDate` 前置守卫，
  // 永远不会走到。不加「看起来更安全」的兜底：静默修正比已知的怪癖更危险。
  return generateConfig.isAfter(date1 as DateType, date2 as DateType);
}

/**
 * 日历网格第一格（左上角）的日期。
 *
 * 关键在第二个 `if`（契约 §3.1.1）：**只有**「对齐后的日期仍落在本月且 > 1 号」
 * 时才回退一周。两个条件缺一不可 —— 跨月时第一格已经在上月，再退就是错的。
 */
export function getWeekStartDate<DateType>(
  locale: string,
  generateConfig: GenerateConfig<DateType>,
  value: DateType,
): DateType {
  const weekFirstDay = generateConfig.locale.getWeekFirstDay(locale);
  const monthStartDate = generateConfig.setDate(value, 1);
  const startDateWeekDay = generateConfig.getWeekDay(monthStartDate);
  let alignStartDate = generateConfig.addDate(monthStartDate, weekFirstDay - startDateWeekDay);
  if (
    generateConfig.getMonth(alignStartDate) === generateConfig.getMonth(value) &&
    generateConfig.getDate(alignStartDate) > 1
  ) {
    alignStartDate = generateConfig.addDate(alignStartDate, -7);
  }
  return alignStartDate;
}

/** 空值 ⇒ `''`；`format` 是函数 ⇒ 直接调用；否则走 `generateConfig.locale.format`。 */
export function formatValue<DateType>(
  value: DateType | null | undefined,
  options: {
    generateConfig: GenerateConfig<DateType>;
    locale: PickerLocale;
    format: string | ((value: DateType) => string);
  },
): string {
  const { generateConfig, locale, format } = options;
  if (!value) {
    return '';
  }
  return typeof format === 'function'
    ? format(value)
    : generateConfig.locale.format(locale.locale, value, format);
}

/**
 * 把 `time` 的时分秒毫秒填进 `date`。
 *
 * ⚠️ `time` 为空时是把四个字段**全部置 0**，不是「保留 date 原来的时间」。
 */
export function fillTime<DateType>(
  generateConfig: GenerateConfig<DateType>,
  date: DateType,
  time?: DateType,
): DateType {
  let tmpDate = date;
  tmpDate = generateConfig.setHour(tmpDate, time ? generateConfig.getHour(time) : 0);
  tmpDate = generateConfig.setMinute(tmpDate, time ? generateConfig.getMinute(time) : 0);
  tmpDate = generateConfig.setSecond(tmpDate, time ? generateConfig.getSecond(time) : 0);
  tmpDate = generateConfig.setMillisecond(tmpDate, time ? generateConfig.getMillisecond(time) : 0);
  return tmpDate;
}

/** 周号列用。单列在这里只为 ui 层少写一次 `generateConfig.locale`。 */
export function getWeekNumber<DateType>(
  generateConfig: GenerateConfig<DateType>,
  locale: string,
  date: DateType,
): number {
  return generateConfig.locale.getWeek(locale, date);
}

/** week 面板用整行选择而不是单元格选择（契约 §3.4.2）。 */
export function isWeekMode(mode: PanelMode): boolean {
  return mode === 'week';
}
