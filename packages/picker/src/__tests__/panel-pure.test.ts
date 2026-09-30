/**
 * 面板层的**纯函数内核**行为测试（L1）。
 *
 * 覆盖本轮新增的 6 个模块：
 *   `locale-fill` / `time-config` / `time-units` / `time-tmpl` /
 *   `panel-header-limit` / `toggle-dates`
 *
 * ⚠️ 这 6 个模块**都没有 Oracle**。判据来自契约 §2.1 的「整条 import 链」：
 * 它们各自的上游（`hooks/useLocale.js` / `hooks/useTimeConfig.js` /
 * `hooks/useTimeInfo.js` / `TimePanelBody/index.js` / `TimeColumn.js` /
 * `PanelHeader.js` / `hooks/useToggleDates.js`）要么直接 `import React`，
 * 要么依赖 React hooks ⇒ 不满足「零 React 耦合」的固化条件。
 * 所以这里是用**行为断言**（含逐字照抄的边界）替代逐位对拍 —— 与 `panel.ts` / `range.ts` 同判。
 */

import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';

import { dayjsGenerateConfig } from '../generate/dayjs';
import { fillLocale, fillTimeFormat } from '../locale-fill';
import type { PanelDateType } from '../panel-context';
import { getHeaderDisabled, getPanelHeaderLimits } from '../panel-header-limit';
import { flattenUnits } from '../time-column';
import type { TimePanelConfig } from '../time-config';
import { fillShowTimeConfig, getTimeProps } from '../time-config';
import {
  fillTimeUnitValue,
  getMeridiemTime,
  getMeridiemUnits,
  getNearestUnitIndex,
  getTimeParts,
  getTriggerDateTemplate,
  isAM,
} from '../time-tmpl';
import { generateUnits, getEnabled, getTimeInfo } from '../time-units';
import { toggleDates } from '../toggle-dates';
import type { PickerLocale } from '../types';

/** 与 `misc-util.oracle.test.ts` 同一份 locale 形状，便于交叉核对。 */
const locale: PickerLocale = {
  locale: 'zh_CN',
  fieldDateFormat: 'YYYY-MM-DD',
  fieldTimeFormat: 'HH:mm:ss',
  fieldMonthFormat: 'YYYY-MM',
  fieldYearFormat: 'YYYY',
  fieldWeekFormat: 'gggg-wo',
  fieldQuarterFormat: 'YYYY-[Q]Q',
  fieldDateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
  cellDateFormat: 'D',
  cellYearFormat: 'YYYY',
  cellQuarterFormat: '[Q]Q',
  yearFormat: 'YYYY',
  monthBeforeYear: true,
  week: '周',
};

describe('locale-fill · 时间格式串的拼装', () => {
  it('fillTimeFormat：三段用 `:` 连接，毫秒追加 `.SSS`，上下午追加 ` A`', () => {
    expect(fillTimeFormat(true, true, true)).toBe('HH:mm:ss');
    expect(fillTimeFormat(true, true, true, true)).toBe('HH:mm:ss.SSS');
    expect(fillTimeFormat(true, true, true, false, true)).toBe('hh:mm:ss A');
    expect(fillTimeFormat(true, false, false)).toBe('HH');
  });

  it('fillTimeFormat：12 小时制的小时是 `hh`', () => {
    expect(fillTimeFormat(true, true, false, false, true)).toBe('hh:mm A');
    expect(fillTimeFormat(true, true, false, false, false)).toBe('HH:mm');
  });

  it('⚠️ fillTimeFormat：全 false 时得到空串；只开毫秒时是**前导点**的 `.SSS`', () => {
    expect(fillTimeFormat(false, false, false)).toBe('');
    // 上游是 `cells.join(':')` 之后再 `+= '.SSS'` ⇒ 空 join 也不会去掉那个点
    expect(fillTimeFormat(false, false, false, true)).toBe('.SSS');
    expect(fillTimeFormat(false, false, false, false, true)).toBe(' A');
  });
});

describe('locale-fill · 补齐', () => {
  it('fillLocale：缺的键全部补上（7 个 field + yearFormat + 3 个 cell 格式）', () => {
    const filled = fillLocale({ locale: 'en_US' }, 'HH:mm:ss');
    expect(filled).toMatchObject({
      fieldDateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      fieldDateFormat: 'YYYY-MM-DD',
      fieldTimeFormat: 'HH:mm:ss',
      fieldMonthFormat: 'YYYY-MM',
      fieldYearFormat: 'YYYY',
      fieldWeekFormat: 'gggg-wo',
      fieldQuarterFormat: 'YYYY-[Q]Q',
      yearFormat: 'YYYY',
      cellYearFormat: 'YYYY',
      cellQuarterFormat: '[Q]Q',
      cellDateFormat: 'D',
    });
  });

  it('fillLocale：已给的键不被覆盖', () => {
    const filled = fillLocale({ locale: 'zh_CN', fieldDateFormat: 'A', yearFormat: 'B' }, 'HH');
    expect(filled.fieldDateFormat).toBe('A');
    expect(filled.yearFormat).toBe('B');
  });

  it('⭐ fillLocale：`cellDateFormat` 回退到 `dayFormat`（在那之前才是 `D`）', () => {
    // ⚠️ 这里的 `locale` 是 `PickerLocale` 的**字符串字段**（如 `'en_US'`），不是对象。
    //    （本轮一次全局替换把它误改成了对象，tsc 抓到后改回。）
    expect(fillLocale({ locale: 'x', dayFormat: 'DD' }, 'HH').cellDateFormat).toBe('DD');
    expect(fillLocale({ locale: 'x' }, 'HH').cellDateFormat).toBe('D');
  });

  it('🚨 fillLocale：`monthFormat` 与 `cellMeridiemFormat` **刻意不补**', () => {
    // 上游注释：`Not fill \`monthFormat\` since \`locale.shortMonths\` handle this`
    //           `Not fill \`cellMeridiemFormat\` since AM & PM by default`
    // 补了会改变月格的渲染分支（走 formatValue 而不是 shortMonths[month]）
    const filled = fillLocale({ locale: 'x' }, 'HH');
    expect(filled.monthFormat).toBeUndefined();
    expect(filled.cellMeridiemFormat).toBeUndefined();
  });
});

describe('time-config · getTimeProps 的合并优先级', () => {
  it('`showTime` 对象覆盖同名的顶层 props', () => {
    const [, merged] = getTimeProps({
      locale: { locale: 'x' },
      hourStep: 2,
      showTime: { hourStep: 3 },
    });
    expect(merged.hourStep).toBe(3);
  });

  it('`showTime.defaultValue` 会被写成 `defaultOpenValue`（同时保留原键）', () => {
    const [timeConfig, merged] = getTimeProps({
      locale: { locale: 'x' },
      showTime: { defaultValue: 'D' as never },
    });
    expect(timeConfig.defaultOpenValue).toBe('D');
    // ⚠️ `defaultValue` 本身**仍在**（`timeConfig` 是 `{ defaultOpenValue, ...pickedProps, ...showTimeConfig }`）
    expect((merged as { defaultValue?: unknown }).defaultValue).toBe('D');
  });

  it('`showTime.defaultOpenValue` 优先于 `showTime.defaultValue`', () => {
    const [timeConfig] = getTimeProps({
      locale: { locale: 'x' },
      showTime: { defaultOpenValue: 'O', defaultValue: 'D' as never },
    });
    expect(timeConfig.defaultOpenValue).toBe('O');
  });

  it('🚨 `picker === "time"` 时 `props.format` 被**写进** timeProps；其余 picker 不写', () => {
    const [, mergedTime] = getTimeProps({
      locale: { locale: 'x' },
      picker: 'time',
      format: 'HH:mm',
    });
    expect(mergedTime.format).toBe('HH:mm');

    const [, mergedDate] = getTimeProps({
      locale: { locale: 'x' },
      picker: 'date',
      format: 'HH:mm',
    });
    expect(mergedDate.format).toBeUndefined();
  });

  it('`format` 的三种形态都能取到 propFormat（串 / 数组取首项 / 对象取 .format）', () => {
    expect(getTimeProps({ locale: { locale: 'x' }, format: 'A' })[3]).toBe('A');
    expect(getTimeProps({ locale: { locale: 'x' }, format: ['B', 'C'] as never })[3]).toBe('B');
    expect(getTimeProps({ locale: { locale: 'x' }, format: { format: 'D' } as never })[3]).toBe(
      'D',
    );
    // 非串（如数字）⇒ 不算 propFormat
    expect(getTimeProps({ locale: { locale: 'x' }, format: 12 as never })[3]).toBe(null);
  });

  it('`fillShowConfig`：全 undefined ⇒ 时/分/秒全 true（毫秒不动）', () => {
    const [, merged] = getTimeProps({ locale: { locale: 'x' } });
    expect(merged.showHour).toBe(true);
    expect(merged.showMinute).toBe(true);
    expect(merged.showSecond).toBe(true);
    expect(merged.showMillisecond).toBeUndefined();
  });

  it('`fillShowConfig`：有显式值时，缺省的按「有 false ⇒ true，全是 true ⇒ false」补', () => {
    // 有 false ⇒ 其余缺省 true
    expect(getTimeProps({ locale: { locale: 'x' }, showHour: false })[1].showMinute).toBe(true);
    expect(getTimeProps({ locale: { locale: 'x' }, showHour: false })[1].showSecond).toBe(true);
    // 全是 true（无 false）⇒ 缺省 false
    expect(getTimeProps({ locale: { locale: 'x' }, showHour: true })[1].showMinute).toBe(false);
    expect(getTimeProps({ locale: { locale: 'x' }, showHour: true })[1].showSecond).toBe(false);
  });

  it('⚠️ `showMillisecond` 不参与「有没有显式配置」的判定，也不被兜底', () => {
    // 只给 showMillisecond ⇒ hasShowConfig 为 false ⇒ 走第一个分支（时/分/秒全 true）
    const [, merged] = getTimeProps({ locale: { locale: 'x' }, showMillisecond: true });
    expect(merged.showHour).toBe(true);
    expect(merged.showMinute).toBe(true);
    expect(merged.showSecond).toBe(true);
    expect(merged.showMillisecond).toBe(true);
  });
});

describe('time-config · fillShowTimeConfig', () => {
  const base: TimePanelConfig<PanelDateType> = {};

  it('非 time / datetime 的 picker ⇒ null', () => {
    for (const picker of ['date', 'week', 'month', 'quarter', 'year'] as const) {
      expect(fillShowTimeConfig(picker, undefined, null, base, locale)).toBeNull();
    }
    expect(fillShowTimeConfig('datetime', undefined, null, base, locale)).not.toBeNull();
    expect(fillShowTimeConfig('time', undefined, null, base, locale)).not.toBeNull();
  });

  it('从 `locale.fieldXxxFormat` 反推 show（datetime ⇒ fieldDateTimeFormat）', () => {
    // 'YYYY-MM-DD HH:mm:ss' 里含 H / m / s ⇒ 三档都开
    const result = fillShowTimeConfig('datetime', undefined, null, base, locale);
    expect(result).toMatchObject({
      showHour: true,
      showMinute: true,
      showSecond: true,
      showMillisecond: false,
      format: 'HH:mm:ss',
    });
  });

  it('🚨 `props.format` 能反推 show，但**不会**成为面板格式（只有 `showTime.format` 会）', () => {
    // propFormat = 'HH' ⇒ showHour=true, showMinute=false
    const result = fillShowTimeConfig('time', undefined, 'HH', {}, locale);
    expect(result?.showHour).toBe(true);
    expect(result?.showMinute).toBe(false);
    // ⚠️ 但 format 是**从 show 拼出来的**，不是 'HH'
    expect(result?.format).toBe('HH');
  });

  it('`showTime.format` 优先作为基准，且**同时**成为面板格式', () => {
    const result = fillShowTimeConfig('time', 'HH:mm A', 'MM', {}, locale);
    expect(result?.format).toBe('HH:mm A');
    expect(result?.showHour).toBe(true);
    expect(result?.showMinute).toBe(true);
    expect(result?.showSecond).toBe(false);
  });

  it('⭐ `use12Hours` 的最终值：**显式给了就用给的**，没给才从基准格式里的 a/A/LT/LLL/LTS 推', () => {
    // 🚨 这里最初写反过一次（本轮的实测修正）：
    //    `checkShow = (format, kw, show) => show ?? kw.some(...)` —— `show` 是 `false` 时
    //    走 `??` 的**左**边（`false` 不是 nullish）⇒ **显式 false 会赢**。
    //    所以「格式里有 A 就一定 use12Hours」是错的，只有**未传**时才推。
    const explicitFalse = fillShowTimeConfig(
      'time',
      'HH:mm A',
      null,
      { use12Hours: false },
      locale,
    );
    expect(explicitFalse?.use12Hours).toBe(false);

    const inferred = fillShowTimeConfig('time', 'HH:mm A', null, {}, locale);
    expect(inferred?.use12Hours).toBe(true);
    expect(inferred?.format).toBe('HH:mm A');

    const explicitTrue = fillShowTimeConfig('time', 'HH:mm', null, { use12Hours: true }, locale);
    expect(explicitTrue?.use12Hours).toBe(true);
    expect(explicitTrue?.showHour).toBe(true);
  });

  it('12 小时制下小时格式是 `hh`', () => {
    const result = fillShowTimeConfig('time', undefined, null, { use12Hours: true }, locale);
    // locale.fieldTimeFormat = 'HH:mm:ss' ⇒ 基准含 H/m/s ⇒ 三档开；
    // use12Hours 被 showMeridiem 覆盖为 true ⇒ 小时用 hh
    expect(result?.format).toBe('hh:mm:ss A');
  });

  it('显式 showHour=false 时不会被格式串改回来', () => {
    const result = fillShowTimeConfig('time', undefined, null, { showHour: false }, locale);
    expect(result?.showHour).toBe(false);
  });
});

describe('time-units · generateUnits', () => {
  it('含端点 + 步长', () => {
    expect(generateUnits(0, 5, 2).map((u) => u.value)).toEqual([0, 2, 4]);
    expect(generateUnits(0, 4, 2).map((u) => u.value)).toEqual([0, 2, 4]);
    expect(generateUnits(1, 3).map((u) => u.value)).toEqual([1, 2, 3]);
  });

  it('⚠️ `step < 1` 被**强制为 1**（不是「按小数走」）', () => {
    expect(generateUnits(0, 3, 0.5).map((u) => u.value)).toEqual([0, 1, 2, 3]);
    expect(generateUnits(0, 3, 0).map((u) => u.value)).toEqual([0, 1, 2, 3]);
  });

  it('`step >= 1` 先取整（`| 0`）', () => {
    expect(generateUnits(0, 7, 2.9).map((u) => u.value)).toEqual([0, 2, 4, 6]);
  });

  it('label 补零到 pad 位（默认 2，毫秒传 3）', () => {
    expect(generateUnits(0, 3).map((u) => u.label)).toEqual(['00', '01', '02', '03']);
    expect(generateUnits(0, 3, 1, false, [], 3).map((u) => u.label)).toEqual([
      '000',
      '001',
      '002',
      '003',
    ]);
  });

  it('`hideDisabledOptions` 时禁用档位**从列表里消失**（不是标记）', () => {
    const visible = generateUnits(0, 5, 1, true, [2, 3]);
    expect(visible.map((u) => u.value)).toEqual([0, 1, 4, 5]);
    expect(visible.every((u) => !u.disabled)).toBe(true);

    const marked = generateUnits(0, 5, 1, false, [2, 3]);
    expect(marked.map((u) => u.value)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(marked.filter((u) => u.disabled).map((u) => u.value)).toEqual([2, 3]);
  });
});

describe('time-units · getEnabled', () => {
  const units = generateUnits(0, 3, 1, false, [0]);

  it('给了就用给的；为空则回退**第一个可用档位**', () => {
    expect(getEnabled(units, 2)).toBe(2);
    expect(getEnabled(units, null)).toBe(1);
    expect(getEnabled(units, undefined)).toBe(1);
  });

  it('全禁用 ⇒ undefined', () => {
    expect(getEnabled(generateUnits(0, 2, 1, false, [0, 1, 2]), null)).toBeUndefined();
  });
});

describe('time-units · getTimeInfo', () => {
  const g = dayjsGenerateConfig;

  it('默认 24 档、60 档、60 档、10 档（毫秒步长 100）', () => {
    const info = getTimeInfo(g, {}, dayjs('2026-09-30'));
    expect(info.rowHourUnits).toHaveLength(24);
    expect(info.getMinuteUnits(0)).toHaveLength(60);
    expect(info.getSecondUnits(0, 0)).toHaveLength(60);
    expect(info.getMillisecondUnits(0, 0, 0)).toHaveLength(10);
  });

  it('12 小时制只改 label（`0 → 12`），不改 value', () => {
    const info = getTimeInfo(g, { use12Hours: true }, dayjs('2026-09-30'));
    expect(info.rowHourUnits.map((u) => u.label).slice(0, 3)).toEqual(['12', '01', '02']);
    expect(info.rowHourUnits.map((u) => u.value).slice(0, 3)).toEqual([0, 1, 2]);
    expect(info.rowHourUnits[13]?.label).toBe('01'); // 13 点 ⇒ 显示 01
  });

  it('步长生效；`disabledHours` 标记禁用', () => {
    const info = getTimeInfo(
      g,
      {
        hourStep: 6,
        minuteStep: 15,
        disabledHours: () => [12],
      },
      dayjs('2026-09-30'),
    );
    expect(info.rowHourUnits.map((u) => u.value)).toEqual([0, 6, 12, 18]);
    expect(info.rowHourUnits.filter((u) => u.disabled).map((u) => u.value)).toEqual([12]);
    expect(info.getMinuteUnits(0).map((u) => u.value)).toEqual([0, 15, 30, 45]);
  });

  it('`getValidTime`：把非法档位对齐到「反向第一个 ≤ 当前值」', () => {
    const info = getTimeInfo(g, { disabledHours: () => [3] }, dayjs('2026-09-30'));
    // 3 点被禁 ⇒ 退到 2 点
    const result = info.getValidTime(dayjs('2026-09-30 03:10:00'));
    expect((result as ReturnType<typeof dayjs>).hour()).toBe(2);
  });

  it('`getValidTime` 的第二参换一套禁用规则（按「哪一天」算）', () => {
    const info = getTimeInfo(g, {}, dayjs('2026-09-30'));
    const certain = dayjs('2026-10-01');
    const result = info.getValidTime(dayjs('2026-09-30 03:00:00'), certain);
    // 该日没有禁用规则 ⇒ 原样保留
    expect((result as ReturnType<typeof dayjs>).hour()).toBe(3);
  });

  it('`getValidTime`：`certainDate` 的禁用规则生效', () => {
    const info = getTimeInfo(
      g,
      {
        // ⚠️ 参数类型是 `Dayjs`（`GenerateConfig<Dayjs>` 推出来的），不要写 `never`
        //    —— 那会让整个 `TimePanelConfig` 被推成 `TimePanelConfig<never>`，
        //    于是 `g` 与 `dayjs(...)` 两处都报「不能赋给 never」。
        disabledTime: (date) => (date.date() === 1 ? { disabledHours: () => [5] } : {}),
      },
      dayjs('2026-09-30'),
    );
    const result = info.getValidTime(dayjs('2026-10-01 05:30:00'), dayjs('2026-10-01'));
    expect((result as ReturnType<typeof dayjs>).hour()).toBe(4);
  });

  it('⚠️ 步长非法时发告警（`24 % hourStep` 整除判据，不是范围判据）', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      getTimeInfo(g, { hourStep: 5 }, dayjs('2026-09-30'));
      expect(spy.mock.calls.some((call) => String(call[0]).includes('hourStep'))).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });

  it('ⓘ 合法步长不告警（`6` 能整除 24，`5` 不能）', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      getTimeInfo(g, { hourStep: 6, minuteStep: 5, secondStep: 10 }, dayjs('2026-09-30'));
      expect(spy.mock.calls.filter((call) => String(call[0]).includes('Step'))).toHaveLength(0);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('time-tmpl · 模板日期与改值', () => {
  const g = dayjsGenerateConfig;

  it('`getTimeParts`：空值 ⇒ null', () => {
    expect(getTimeParts(g, null)).toBeNull();
    expect(getTimeParts(g, undefined)).toBeNull();
    expect(getTimeParts(g, dayjs('2026-09-30 01:02:03.004'))).toEqual({
      hour: 1,
      minute: 2,
      second: 3,
      millisecond: 4,
    });
  });

  it('⭐ 三段优先级：value 的时间 > pickerValue 的时间 > 第一档可用值', () => {
    const value = dayjs('2026-01-01 11:22:33');
    const pickerValue = dayjs('2026-02-02 04:05:06');

    // 第 1 段
    const t1 = getTriggerDateTemplate({
      generateConfig: g,
      value: value,
      pickerValue: pickerValue,
      valueTime: getTimeParts(g, value),
      pickerTime: getTimeParts(g, pickerValue),
    });
    expect((t1 as ReturnType<typeof dayjs>).format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2026-01-01 11:22:33',
    );

    // 第 2 段（value 只有日期、没有时间）
    const t2 = getTriggerDateTemplate({
      generateConfig: g,
      value: value,
      pickerValue: pickerValue,
      valueTime: null,
      pickerTime: getTimeParts(g, pickerValue),
    });
    expect((t2 as ReturnType<typeof dayjs>).format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2026-01-01 04:05:06',
    );

    // 第 3 段
    const t3 = getTriggerDateTemplate({
      generateConfig: g,
      value: value,
      pickerValue: pickerValue,
      valueTime: null,
      pickerTime: null,
      validTime: { hour: 7, minute: 8, second: 9, millisecond: 10 },
    });
    expect((t3 as ReturnType<typeof dayjs>).format('HH:mm:ss.SSS')).toBe('07:08:09.010');
  });

  it('三段全空时退回 `getNow()`', () => {
    const t = getTriggerDateTemplate({ generateConfig: g });
    expect(dayjs.isDayjs(t)).toBe(true);
  });

  it('`fillTimeUnitValue`：`null` ⇒ `null`（= 清空该列）', () => {
    const tmpl = dayjs('2026-09-30 10:20:30.400');
    expect(fillTimeUnitValue(g, tmpl, null, 'Hour')).toBeNull();
    // 🚨 返回值是 `DateType`（**日期**），不是被写入的那个数字 —— 本条最初写成 `toBe(5)`，
    //    那是把签名读成了「设值器」。它只负责「拼出新日期」，合法性由 `getValidTime` 收口。
    expect(fillTimeUnitValue(g, tmpl, 5, 'Hour')?.hour()).toBe(5);
    expect(fillTimeUnitValue(g, tmpl, 5, 'Minute')?.minute()).toBe(5);
    expect(fillTimeUnitValue(g, tmpl, 5, 'Second')?.second()).toBe(5);
    expect(fillTimeUnitValue(g, tmpl, 5, 'Millisecond')?.millisecond()).toBe(5);
    // 其余单位不受影响
    expect(fillTimeUnitValue(g, tmpl, 5, 'Hour')?.minute()).toBe(20);
  });

  it('`getMeridiemTime`：只在需要时 ±12；已是同一侧则**原样返回模板**', () => {
    const tmpl = dayjs('2026-09-30 10:00:00');
    expect((getMeridiemTime(g, tmpl, 'pm', 10) as ReturnType<typeof dayjs>).hour()).toBe(22);
    expect((getMeridiemTime(g, tmpl, 'am', 10) as ReturnType<typeof dayjs>).hour()).toBe(10);

    const pm = dayjs('2026-09-30 22:00:00');
    expect((getMeridiemTime(g, pm, 'am', 22) as ReturnType<typeof dayjs>).hour()).toBe(10);
    expect((getMeridiemTime(g, pm, 'pm', 22) as ReturnType<typeof dayjs>).hour()).toBe(22);
  });

  it('`getMeridiemTime`：`null` ⇒ `null`；`hour` 为空 ⇒ 原样返回模板', () => {
    const tmpl = dayjs('2026-09-30 10:00:00');
    expect(getMeridiemTime(g, tmpl, null, 10)).toBeNull();
    expect(getMeridiemTime(g, tmpl, 'pm', null)).toBe(tmpl);
    expect(getMeridiemTime(g, tmpl, 'pm', undefined)).toBe(tmpl);
  });

  it('`isAM`：`< 12` 为上午（12 点是下午）', () => {
    expect(isAM(0)).toBe(true);
    expect(isAM(11)).toBe(true);
    expect(isAM(12)).toBe(false);
    expect(isAM(23)).toBe(false);
  });

  it('`getNearestUnitIndex`：找最近的格；禁用格被推到最大距离', () => {
    const units = generateUnits(0, 3, 1);
    expect(getNearestUnitIndex(units, [0, 10, 20, 30], 12)).toBe(1);
    expect(getNearestUnitIndex(units, [0, 10, 20, 30], 26)).toBe(3);

    const withDisabled = generateUnits(0, 3, 1, false, [1]);
    // 禁用格（下标 1）即使最近也不能被选中
    expect(getNearestUnitIndex(withDisabled, [0, 10, 20, 30], 11)).toBe(2);
    // 全都禁用时，第一格仍会被选中（MAX_SAFE_INTEGER 相等 ⇒ findIndex 取首个）
    const allDisabled = generateUnits(0, 2, 1, false, [0, 1, 2]);
    expect(getNearestUnitIndex(allDisabled, [0, 10, 20], 10)).toBe(0);
  });

  it('`getMeridiemUnits`：两档 + 禁用判据（「所有小时都不是这一侧」）', () => {
    const units = generateUnits(0, 23, 1);
    const meridiem = getMeridiemUnits(g, locale, units);
    expect(meridiem.map((u) => u.value)).toEqual(['am', 'pm']);
    expect(meridiem.map((u) => u.label)).toEqual(['AM', 'PM']);
    expect(meridiem.every((u) => !u.disabled)).toBe(true);
  });

  it('`getMeridiemUnits`：`cellMeridiemFormat` 给了就格式化 9 点 / 15 点', () => {
    const units = generateUnits(0, 23, 1);
    const meridiem = getMeridiemUnits(g, { ...locale, cellMeridiemFormat: 'A' }, units);
    expect(meridiem.map((u) => u.label)).toEqual(['AM', 'PM']);

    const zh = getMeridiemUnits(g, { ...locale, cellMeridiemFormat: 'LT' }, units);
    // LT 在 dayjs 的 zh_CN 下是「上午10:00」这类；这里只断言「不是默认的 AM/PM」
    expect(zh[0]?.label).not.toBe('AM');
  });

  it('`getMeridiemUnits`：只留上午的小时 ⇒ PM 禁用', () => {
    const amOnly = generateUnits(0, 23, 1).filter((u) => u.value < 12);
    const meridiem = getMeridiemUnits(g, locale, amOnly);
    expect(meridiem[0]?.disabled).toBe(false);
    expect(meridiem[1]?.disabled).toBe(true);
  });
});

describe('panel-header-limit · 粒度', () => {
  const g = dayjsGenerateConfig;
  const pickerValue = dayjs('2026-09-30');

  it('date / week：有 `offset`（月）与 `superOffset`（年）；`getEnd` = 下月 1 号 − 1 天', () => {
    for (const mode of ['date', 'week'] as const) {
      const limits = getPanelHeaderLimits(mode, g);
      expect(limits.offset).toBeTypeOf('function');
      expect(limits.superOffset).toBeTypeOf('function');
      expect(limits.offset?.(-1, pickerValue).format('YYYY-MM')).toBe('2026-08');
      expect(limits.superOffset?.(-1, pickerValue).format('YYYY')).toBe('2025');
      expect(limits.getStart?.(pickerValue).format('YYYY-MM-DD')).toBe('2026-09-01');
      expect(limits.getEnd?.(pickerValue).format('YYYY-MM-DD')).toBe('2026-09-30');
      // 2 月（闰年）走「下月 1 号 − 1 天」
      expect(limits.getEnd?.(dayjs('2024-02-15')).format('YYYY-MM-DD')).toBe('2024-02-29');
    }
  });

  it('🚨 month / quarter：**没有** `offset`（上一级已是年）；`getEnd` 是 `setMonth(11)`', () => {
    for (const mode of ['month', 'quarter'] as const) {
      const limits = getPanelHeaderLimits(mode, g);
      expect(limits.offset).toBeUndefined();
      expect(limits.superOffset?.(-1, pickerValue).format('YYYY')).toBe('2025');
      // 🚨 `getStart` / `getEnd` **只换月、不动日** —— 上游是裸的
      //    `setMonth(date, 0)` / `setMonth(date, 11)`，**没有** `setDate(…, 1)`。
      //    所以 9/30 进去得到的是 **1/30** 与 **12/30**，不是 1/1 与 12/1。
      //    本条最初按「day 面板的 getStart 有 `setDate(date, 1)`」类推，写成了 1/1 / 12/1 ——
      //    两个面板的写法确实不同，照抄时最容易混。差异可观测：`minDate: 2026-01-15` 时
      //    `getStart` = 1/30 ≥ 1/15 ⇒ 上一屏可用；按 1/1 算则会被判越界。
      expect(limits.getStart?.(pickerValue).format('YYYY-MM-DD')).toBe('2026-01-30');
      expect(limits.getEnd?.(pickerValue).format('YYYY-MM-DD')).toBe('2026-12-30');
    }
  });

  it('year：`superOffset` 乘 10；`getStart` 是十年起点、`getEnd` 是 +9 年', () => {
    const limits = getPanelHeaderLimits('year', g);
    expect(limits.offset).toBeUndefined();
    expect(limits.superOffset?.(1, pickerValue).format('YYYY')).toBe('2036');
    expect(limits.getStart?.(pickerValue).format('YYYY-MM-DD')).toBe('2020-09-30');
    expect(limits.getEnd?.(pickerValue).format('YYYY-MM-DD')).toBe('2029-09-30');
  });

  it('decade：`superOffset` 乘 100；起点是百年', () => {
    const limits = getPanelHeaderLimits('decade', g);
    expect(limits.superOffset?.(1, pickerValue).format('YYYY')).toBe('2126');
    expect(limits.getStart?.(pickerValue).format('YYYY')).toBe('2000');
    expect(limits.getEnd?.(pickerValue).format('YYYY')).toBe('2099');
  });

  it('time / datetime 没有表头配置 ⇒ 抛错（不静默返回空壳）', () => {
    expect(() => getPanelHeaderLimits('time', g)).toThrow(/没有表头配置/);
  });
});

describe('panel-header-limit · 越界判定', () => {
  const g = dayjsGenerateConfig;
  const pickerValue = dayjs('2026-09-30');
  const limits = getPanelHeaderLimits('date', g);
  const monthLimits = getPanelHeaderLimits('month', g);
  const decadeLimits = getPanelHeaderLimits('decade', g);

  const ctx = (over: Record<string, unknown> = {}) => ({
    generateConfig: g,
    locale,
    panelType: 'date' as const,
    pickerValue,
    ...over,
  });

  it('两侧限制都不给 ⇒ 四个方向都可用', () => {
    expect(getHeaderDisabled(ctx(), limits)).toEqual({
      prev: false,
      superPrev: false,
      next: false,
      superNext: false,
    });
  });

  it('只给 `minDate` ⇒ 只有 prev 侧会被判；next 侧恒 false', () => {
    // 下限是本月 5 号 ⇒ 上一格（8 月）的区间终点 8/31 < 9/5 ⇒ prev 禁用
    const result = getHeaderDisabled(ctx({ minDate: dayjs('2026-09-05') }), limits);
    expect(result.prev).toBe(true);
    expect(result.superPrev).toBe(true);
    expect(result.next).toBe(false);
    expect(result.superNext).toBe(false);
  });

  it('`minDate` 落在上一格区间内 ⇒ prev 可用，但 superPrev **仍禁用**', () => {
    // 下限 2026-08-20，两档的粒度不同、必须各算各的：
    //   prev      看「上一格」= 8 月 → getEnd(8/30) = 8/31 ≥ 8/20 ⇒ **可用**
    //   superPrev 看「上一屏」= 2025-09-30 → getEnd = 2025-09-30 < 2026-08-20 ⇒ **禁用**
    // 🚨 本条最初把 superPrev 也期望成 `false` —— 那是默认了「prev 可用 ⇒ 上一屏也可用」。
    const result = getHeaderDisabled(ctx({ minDate: dayjs('2026-08-20') }), limits);
    expect(result.prev).toBe(false);
    expect(result.superPrev).toBe(true);
  });

  it('只给 `maxDate` ⇒ 只有 next 侧会被判', () => {
    // 上限是本月 10 号 ⇒ 下一格（10 月）的区间起点 10/1 > 10/10 不成立… 用更早的上限
    const result = getHeaderDisabled(ctx({ maxDate: dayjs('2026-09-10') }), limits);
    expect(result.prev).toBe(false);
    expect(result.superPrev).toBe(false);
    expect(result.next).toBe(true);
    expect(result.superNext).toBe(true);
  });

  it('`maxDate` 足够远 ⇒ next 可用', () => {
    const result = getHeaderDisabled(ctx({ maxDate: dayjs('2030-01-01') }), limits);
    expect(result.next).toBe(false);
    expect(result.superNext).toBe(false);
  });

  it('🚨 没有 `offset` 的面板（month）⇒ prev / next 恒 false，即使给了限制', () => {
    const result = getHeaderDisabled(
      ctx({
        panelType: 'month',
        minDate: dayjs('2026-12-01'),
        maxDate: dayjs('2020-01-01'),
      }),
      monthLimits,
    );
    // 这两条是「缺 `offset` ⇒ 表头根本不渲染这两个按钮」在判定侧的对应物：
    // 即使 minDate / maxDate 都给了也返回 false（`!offset` 直接短路）。
    expect(result.prev).toBe(false);
    expect(result.next).toBe(false);

    // super 侧：粒度是 `type`（这里是 `'month'`），且**只换月不换日**。
    //   superPrev：superOffset(-1, 9/30) = 2025-09-30 → getEnd = setMonth(…, 11) = 2025-12-30
    //              2025-12-30 ≥ 2026-12-01 ? 否 ⇒ **禁用**
    expect(result.superPrev).toBe(true);
    //   superNext：superOffset(1, 9/30) = 2027-09-30 → getStart = setMonth(…, 0) = 2027-01-30
    //              maxDate 2020-01-01 ≥ 2027-01-30 ? 否 ⇒ **禁用**
    expect(result.superNext).toBe(true);
  });

  it('decade 的越界按「世纪」判', () => {
    const result = getHeaderDisabled(
      ctx({ panelType: 'decade', minDate: dayjs('2050-01-01') }),
      decadeLimits,
    );
    // 上一世纪 [1900,1999] 的终点 1999 < 2050 ⇒ 禁用
    expect(result.superPrev).toBe(true);
  });

  it('⚠️ `getEnd` / `getStart` 缺一不可：缺了就当「判不了」⇒ false', () => {
    const partial = { ...limits, getEnd: undefined };
    const result = getHeaderDisabled(ctx({ minDate: dayjs('2026-09-05') }), partial);
    expect(result.prev).toBe(false);
    expect(result.superPrev).toBe(false);
  });
});

describe('toggle-dates', () => {
  const g = dayjsGenerateConfig;
  const d = (s: string) => dayjs(s);

  it('不在列表里 ⇒ 追加到**末尾**（返回新数组）', () => {
    const list = [d('2026-01-01')];
    const next = toggleDates(g, locale, 'date', list, d('2026-02-02'));
    expect(next).toHaveLength(2);
    expect((next[1] as ReturnType<typeof dayjs>).format('YYYY-MM-DD')).toBe('2026-02-02');
    // 原数组不被改
    expect(list).toHaveLength(1);
  });

  it('已在列表里 ⇒ 移除（保持原顺序）', () => {
    const list = [d('2026-01-01'), d('2026-02-02'), d('2026-03-03')];
    const next = toggleDates(g, locale, 'date', list, d('2026-02-02'));
    expect(next.map((x) => (x as ReturnType<typeof dayjs>).format('MM-DD'))).toEqual([
      '01-01',
      '03-03',
    ]);
    expect(list).toHaveLength(3);
  });

  it('⭐ 判等粒度是 `panelMode`：week 模式下「同一周的另一天」算同一个', () => {
    const list = [d('2026-09-28')]; // 周一
    // 2026-10-01 是同一周（周首 = 9/28）
    const next = toggleDates(g, locale, 'week', list, d('2026-10-01'));
    expect(next).toHaveLength(0);

    // date 粒度下则是新增
    const next2 = toggleDates(g, locale, 'date', list, d('2026-10-01'));
    expect(next2).toHaveLength(2);
  });

  it('列表里的空值不会误命中', () => {
    const list = [null, undefined, d('2026-01-01')];
    const next = toggleDates(g, locale, 'date', list, d('2026-01-01'));
    // 命中下标 2 ⇒ 移除后剩两个空位
    expect(next).toHaveLength(2);
    expect((next[0] as unknown) === null).toBe(true);
  });
});

describe('time-column · flattenUnits 指纹', () => {
  it('把 value,label,disabled 用 `,` 连接、档位之间用 `;`', () => {
    expect(flattenUnits(generateUnits(0, 1, 1))).toBe('0,00,false;1,01,false');
    expect(flattenUnits(generateUnits(0, 1, 1, false, [1]))).toBe('0,00,false;1,01,true');
    expect(flattenUnits([])).toBe('');
  });

  it('内容相同即指纹相同（用于避免 `units` 每次新建数组导致的对齐抖动）', () => {
    expect(flattenUnits(generateUnits(0, 5, 1))).toBe(flattenUnits(generateUnits(0, 5, 1)));
  });
});
