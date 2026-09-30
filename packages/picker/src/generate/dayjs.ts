/**
 * dayjs 适配层 —— 把 `GenerateConfig<Dayjs>` 落到 dayjs 上。
 *
 * ⚠️ 本模块**有副作用**：模块顶层 `dayjs.extend(...)`。
 * 插件集合必须与上游 `es/generate/dayjs.js` 一致，否则 `getWeek` /
 * `getShortWeekDays` 会抛或返回错误值（契约 §3.3）。
 *
 * 设计取舍见契约 §9 的 P2：保留 `GenerateConfig` 抽象是为了让 Oracle 能逐位对拍。
 */

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
// 🚨 **必须带 `.js` 后缀**（2026-10-01 由 `tests/build` 的 B8 抓到）：
//    dayjs 1.11.23 的 `package.json` **没有 `exports` 字段** ⇒ Node ESM 解析子路径时
//    **必须给完整文件名**。写 `'dayjs/plugin/advancedFormat'` 在 Vite/vitest 下能解析
//    （它们会补后缀），但在 **Node ESM** 下报
//    `Cannot find module '…/dayjs/plugin/advancedFormat'`。
//    ⚠️ 这个 bug 一直潜伏：`picker` 自己的 B8 是 `n/a`（「本包不含组件」）⇒ 从不 import 它的 dist；
//    直到 `ui` 导出 `DatePicker`（它 import 了 picker）后，`ui` 的 B8 才把它暴露出来。
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import localeData from 'dayjs/plugin/localeData.js';
import weekday from 'dayjs/plugin/weekday.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import weekYear from 'dayjs/plugin/weekYear.js';

import type { GenerateConfig } from '../types';

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

/**
 * `Wo`（ISO 周序号）dayjs 不认，上游把它降级成 `wo`。
 * 上游注释写着「todo support Wo」，是**已知的未支持项**，我们照抄这个降级。
 */
dayjs.extend((_option: unknown, c: typeof Dayjs) => {
  const proto = c.prototype;
  const oldFormat = proto.format;
  proto.format = function format(this: Dayjs, formatStr?: string): string {
    const str = (formatStr ?? '').replace('Wo', 'wo');
    return oldFormat.bind(this)(str);
  };
});

/**
 * rc-picker 的 localeCode（`zh_CN`）→ dayjs 的 locale 名（`zh-cn`）。
 *
 * 这是**照抄的数据**（上游 `generate/dayjs.js:23-90`）：映射表里没有的一律 fallback
 * 到 `split('_')[0]`。改动它会静默改变所有面板的周起始日与月份名。
 */
const LOCALE_MAP: Record<string, string> = {
  bn_BD: 'bn-bd',
  by_BY: 'be',
  en_GB: 'en-gb',
  en_US: 'en',
  fr_BE: 'fr',
  fr_CA: 'fr-ca',
  hy_AM: 'hy-am',
  kmr_IQ: 'ku',
  nl_BE: 'nl-be',
  pt_BR: 'pt-br',
  zh_CN: 'zh-cn',
  zh_HK: 'zh-hk',
  zh_TW: 'zh-tw',
};

function parseLocale(locale: string): string {
  const mapped: string | undefined = LOCALE_MAP[locale];
  // 等价于上游的 `locale.split('_')[0]`，但绕开 `noUncheckedIndexedAccess` 的
  // 「索引可能越界」—— 不必引入一个永远走不到的兜底分支。
  return mapped ?? locale.replace(/_.*$/, '');
}

/**
 * 把「用户自己 extend 过的 dayjs 实例」换成**本模块**拿到的实例。
 *
 * 上游判据是 `!isDayjs(v) || v instanceof dayjs ⇒ v`；对真正的 Dayjs 输入
 * `v instanceof dayjs` 恒为 false，所以实际等价于「Dayjs 一律重包」。
 * 这里写成显式的三元，语义相同但可读性更好。
 */
function toLocalDayjs(value: Dayjs): Dayjs {
  return dayjs.isDayjs(value) ? dayjs(value.valueOf()) : value;
}

export const dayjsGenerateConfig: GenerateConfig<Dayjs> = {
  // ------------------------------------------------------------- get
  getNow: () => {
    const now = dayjs();
    // 上游：装了 timezone 插件时用它取默认时区（antd#50934）。
    const withTz = now as Dayjs & { tz?: () => Dayjs };
    if (typeof withTz.tz === 'function') {
      return withTz.tz();
    }
    return now;
  },
  getFixedDate: (string) => dayjs(string, ['YYYY-M-DD', 'YYYY-MM-DD']),
  getEndDate: (date) => toLocalDayjs(date).endOf('month'),
  getWeekDay: (date) => {
    const clone = toLocalDayjs(date).locale('en');
    return clone.weekday() + clone.localeData().firstDayOfWeek();
  },
  getYear: (date) => toLocalDayjs(date).year(),
  getMonth: (date) => toLocalDayjs(date).month(),
  getDate: (date) => toLocalDayjs(date).date(),
  getHour: (date) => toLocalDayjs(date).hour(),
  getMinute: (date) => toLocalDayjs(date).minute(),
  getSecond: (date) => toLocalDayjs(date).second(),
  getMillisecond: (date) => toLocalDayjs(date).millisecond(),

  // ------------------------------------------------------------- add
  addYear: (date, diff) => toLocalDayjs(date).add(diff, 'year'),
  addMonth: (date, diff) => toLocalDayjs(date).add(diff, 'month'),
  addDate: (date, diff) => toLocalDayjs(date).add(diff, 'day'),

  // ------------------------------------------------------------- set
  setYear: (date, year) => toLocalDayjs(date).year(year),
  setMonth: (date, month) => toLocalDayjs(date).month(month),
  setDate: (date, num) => toLocalDayjs(date).date(num),
  setHour: (date, hour) => toLocalDayjs(date).hour(hour),
  setMinute: (date, minute) => toLocalDayjs(date).minute(minute),
  setSecond: (date, second) => toLocalDayjs(date).second(second),
  setMillisecond: (date, millisecond) => toLocalDayjs(date).millisecond(millisecond),

  // --------------------------------------------------------- compare
  isAfter: (date1, date2) => toLocalDayjs(date1).isAfter(toLocalDayjs(date2)),
  isValidate: (date) => toLocalDayjs(date).isValid(),

  locale: {
    getWeekFirstDay: (locale) => dayjs().locale(parseLocale(locale)).localeData().firstDayOfWeek(),
    getWeekFirstDate: (locale, date) => toLocalDayjs(date).locale(parseLocale(locale)).weekday(0),
    getWeek: (locale, date) => toLocalDayjs(date).locale(parseLocale(locale)).week(),
    getShortWeekDays: (locale) => dayjs().locale(parseLocale(locale)).localeData().weekdaysMin(),
    getShortMonths: (locale) => dayjs().locale(parseLocale(locale)).localeData().monthsShort(),
    format: (locale, date, format) => toLocalDayjs(date).locale(parseLocale(locale)).format(format),
    parse: (locale, text, formats) => {
      const localeStr = parseLocale(locale);
      for (const format of formats) {
        // `wo` / `Wo` 无法直接解析（dayjs 的 customParseFormat 不支持周序号），
        // 上游改成「从年初开始逐周试 52 次」。
        if (format.includes('wo') || format.includes('Wo')) {
          const year = text.split('-')[0] ?? '';
          const weekStr = text.split('-')[1] ?? '';
          const firstWeek = dayjs(year, 'YYYY').startOf('year').locale(localeStr);
          for (let j = 0; j <= 52; j += 1) {
            const nextWeek = firstWeek.add(j, 'week');
            if (nextWeek.format('Wo') === weekStr) {
              return nextWeek;
            }
          }
          return null;
        }
        const parsed = dayjs(text, format, true).locale(localeStr);
        if (parsed.isValid()) {
          return parsed;
        }
      }
      return null;
    },
  },
};
