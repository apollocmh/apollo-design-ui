/**
 * locale 的**补齐**（把可选格式串填成确定值）。
 *
 * 读源码作规格：`@rc-component/picker@1.12.2` 的 `es/hooks/useLocale.js`。
 * ⚠️ 上游那个模块 `import React` ⇒ **不可对拍**（契约 §2.1 的判据：看整条 import 链）；
 * 这里把其中的两个纯函数逐行重写，由 `src/__tests__/locale-fill.test.ts` 覆盖。
 *
 * 上游把它写成 `useLocale` 的唯一目的是 `useMemo` —— 补齐本身是纯计算，
 * 本仓去掉了那层 hook（`useTimeConfig` / 面板组件各自调用即可）。
 */

import type { PickerLocale } from './types';

/**
 * 按「显示哪几列」拼出时间格式串。
 *
 * 三条细节，全都是上游形态：
 *  1. 12 小时制的小时用 `hh`，否则 `HH`；
 *  2. 毫秒是**追加** `.SSS`（不是 join 进去）—— 所以 `showHour=false` 而
 *     `showMillisecond=true` 时得到的是 `'.SSS'`（前导点保留）；
 *  3. 上下午是**追加** `' A'`（前导空格保留）。
 */
export function fillTimeFormat(
  showHour?: boolean,
  showMinute?: boolean,
  showSecond?: boolean,
  showMillisecond?: boolean,
  showMeridiem?: boolean,
): string {
  const cells: string[] = [];
  if (showHour) {
    cells.push(showMeridiem ? 'hh' : 'HH');
  }
  if (showMinute) {
    cells.push('mm');
  }
  if (showSecond) {
    cells.push('ss');
  }
  let timeFormat = cells.join(':');

  if (showMillisecond) {
    timeFormat += '.SSS';
  }
  if (showMeridiem) {
    timeFormat += ' A';
  }
  return timeFormat;
}

/**
 * 把 `PickerLocale` 里**可选**的格式串补成确定值。
 *
 * ⚠️ 两个刻意的「不补」（上游注释原话：`Not fill \`monthFormat\` since \`locale.shortMonths\`
 * handle this` / `Not fill \`cellMeridiemFormat\` since AM & PM by default`）：
 * `monthFormat` 与 `cellMeridiemFormat` **保持 `undefined`** —— 面板读到 `undefined`
 * 时走 `shortMonths` / 内置 `AM`·`PM` 兜底。补了会改变月格的渲染分支。
 */
export function fillLocale(locale: PickerLocale, timeFormat: string): PickerLocale {
  const {
    fieldDateTimeFormat,
    fieldDateFormat,
    fieldTimeFormat,
    fieldMonthFormat,
    fieldYearFormat,
    fieldWeekFormat,
    fieldQuarterFormat,
    yearFormat,
    cellYearFormat,
    cellQuarterFormat,
    dayFormat,
    cellDateFormat,
  } = locale;

  return {
    ...locale,
    fieldDateTimeFormat: fieldDateTimeFormat || `YYYY-MM-DD ${timeFormat}`,
    fieldDateFormat: fieldDateFormat || 'YYYY-MM-DD',
    fieldTimeFormat: fieldTimeFormat || timeFormat,
    fieldMonthFormat: fieldMonthFormat || 'YYYY-MM',
    fieldYearFormat: fieldYearFormat || 'YYYY',
    fieldWeekFormat: fieldWeekFormat || 'gggg-wo',
    fieldQuarterFormat: fieldQuarterFormat || 'YYYY-[Q]Q',
    yearFormat: yearFormat || 'YYYY',
    cellYearFormat: cellYearFormat || 'YYYY',
    cellQuarterFormat: cellQuarterFormat || '[Q]Q',
    cellDateFormat: cellDateFormat || dayFormat || 'D',
  };
}
