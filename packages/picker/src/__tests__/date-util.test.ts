/**
 * `date-util` 的**自身 API 面**测试。
 *
 * ⚠️ 与 `date-util.oracle.test.ts` **并存**，不能互相替代（PITFALLS 60）：
 *   - oracle 证明「与上游一致」，但**不**覆盖本包新增的导出，
 *     也**不**解释「为什么是这个值」；
 *   - 这里用**显式属性断言**钉住语义本身 —— 万一两侧一起错，oracle 看不出来。
 */

import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';

import {
  WEEK_DAY_COUNT,
  fillTime,
  formatValue,
  getQuarter,
  getWeekNumber,
  getWeekStartDate,
  isInRange,
  isSame,
  isSameWeek,
  isWeekMode,
} from '../date-util';
import { dayjsGenerateConfig as g } from '../generate/dayjs';
import type { PickerLocale } from '../types';

const LOCALE: PickerLocale = { locale: 'zh_CN', fieldDateFormat: 'YYYY-MM-DD' };
const D = (s: string): Dayjs => dayjs(s);
const fmt = (d: Dayjs): string => d.format('YYYY-MM-DD');

describe('常量与本包新增导出', () => {
  it('WEEK_DAY_COUNT 是 7', () => {
    expect(WEEK_DAY_COUNT).toBe(7);
  });

  it('getWeekNumber 走 generateConfig.locale.getWeek', () => {
    expect(getWeekNumber(g, 'zh_CN', D('2026-09-19'))).toBe(
      g.locale.getWeek('zh_CN', D('2026-09-19')),
    );
  });

  it('isWeekMode 只有 week 为真', () => {
    expect(isWeekMode('week')).toBe(true);
    for (const mode of ['date', 'month', 'quarter', 'year', 'decade', 'time'] as const) {
      expect(isWeekMode(mode)).toBe(false);
    }
  });
});

describe('语义本身的显式断言（oracle 之外的第二道）', () => {
  it('isInRange 是**开区间** —— 端点不算在内', () => {
    const start = D('2026-01-01');
    const end = D('2026-01-10');
    expect(isInRange(g, start, end, D('2026-01-05'))).toBe(true);
    expect(isInRange(g, start, end, start)).toBe(false);
    expect(isInRange(g, start, end, end)).toBe(false);
  });

  it('isInRange 任一参数为空 ⇒ false（不是「不限制」）', () => {
    expect(isInRange(g, null, D('2026-01-10'), D('2026-01-05'))).toBe(false);
    expect(isInRange(g, D('2026-01-01'), null, D('2026-01-05'))).toBe(false);
    expect(isInRange(g, D('2026-01-01'), D('2026-01-10'), null)).toBe(false);
  });

  it('getQuarter：月份 0-based，1–3 月是 Q1', () => {
    expect(getQuarter(g, D('2026-01-15'))).toBe(1);
    expect(getQuarter(g, D('2026-03-31'))).toBe(1);
    expect(getQuarter(g, D('2026-04-01'))).toBe(2);
    expect(getQuarter(g, D('2026-12-31'))).toBe(4);
  });

  it('fillTime 无 time ⇒ 四个字段全置 0（不是保留原时间）', () => {
    const out = fillTime(g, D('2026-09-19T13:45:30.500'));
    expect(out.format('YYYY-MM-DDTHH:mm:ss.SSS')).toBe('2026-09-19T00:00:00.000');
  });

  it('fillTime 有 time ⇒ 四个字段全被覆盖（含毫秒）', () => {
    const out = fillTime(g, D('2026-09-19T00:00:00.000'), D('1999-01-01T01:02:03.004'));
    expect(out.format('YYYY-MM-DDTHH:mm:ss.SSS')).toBe('2026-09-19T01:02:03.004');
  });

  it('formatValue 空值 ⇒ 空串', () => {
    expect(formatValue(null, { generateConfig: g, locale: LOCALE, format: 'YYYY' })).toBe('');
    expect(
      formatValue(undefined, { generateConfig: g, locale: LOCALE, format: 'YYYY' }),
    ).toBe('');
  });

  it('isSame 的 default 分支走 isSameTimestamp（type = datetime）', () => {
    const a = D('2026-01-01T10:00:00.000');
    const b = D('2026-01-01T10:00:00.000');
    const c = D('2026-01-01T10:00:01.000');
    expect(isSame(g, LOCALE, a, b, 'datetime')).toBe(true);
    expect(isSame(g, LOCALE, a, c, 'datetime')).toBe(false);
    // 同一天但不同时刻：'date' 粒度下相等，'datetime' 下不等
    expect(isSame(g, LOCALE, a, c, 'date')).toBe(true);
  });
});

describe('getWeekStartDate 的回退分支（契约 §3.1.1）', () => {
  it('本月 1 号正好是周起始日 ⇒ 不回退', () => {
    // 2026-06-01 是周一（zh_CN 周一起）⇒ 首格就是 6/1
    const value = D('2026-06-10');
    expect(fmt(getWeekStartDate('zh_CN', g, value))).toBe('2026-06-01');
  });

  it('⭐ 对齐后仍在本月且 > 1 号 ⇒ 回退一周', () => {
    // en_US 周日为首：2026-06-01 是周一 ⇒ 对齐到 5/31（周日），已跨月 ⇒ 不回退
    expect(fmt(getWeekStartDate('en_US', g, D('2026-06-10')))).toBe('2026-05-31');
    // zh_CN 周一为首：对齐到 6/1（周一），同月但 date === 1 ⇒ 不回退
    expect(fmt(getWeekStartDate('zh_CN', g, D('2026-06-10')))).toBe('2026-06-01');
  });

  it('首格必定 ≤ 本月 1 号，且相差不超过 7 天', () => {
    for (const text of ['2026-01-01', '2026-02-28', '2024-02-29', '2026-09-19', '1999-12-31']) {
      const value = D(text);
      for (const code of ['zh_CN', 'en_US']) {
        const start = getWeekStartDate(code, g, value);
        const diff = start.diff(g.setDate(value, 1), 'day');
        expect(diff).toBeLessThanOrEqual(0);
        expect(diff).toBeGreaterThanOrEqual(-7);
      }
    }
  });

  it('首格与本月 1 号的星期差 = 该 locale 的周起始日偏移', () => {
    const value = D('2026-09-19');
    for (const code of ['zh_CN', 'en_US']) {
      const start = getWeekStartDate(code, g, value);
      expect(g.getWeekDay(start)).toBe(g.locale.getWeekFirstDay(code));
    }
  });
});

describe('isSameWeek 的跨年行为（上游用 isSameYear 比周起始日）', () => {
  it('⭐ 周序号相同但分属不同年份 ⇒ 不相等（isSameYear 那道判据真的在起作用）', () => {
    let found = 0;
    for (let y = 2020; y <= 2026 && found < 5; y += 1) {
      for (let m = 0; m < 12 && found < 5; m += 1) {
        const a = dayjs(new Date(y, m, 10));
        const b = dayjs(new Date(y + 1, m, 10));
        if (g.locale.getWeek('zh_CN', a) === g.locale.getWeek('zh_CN', b)) {
          expect(isSameWeek(g, 'zh_CN', a, b)).toBe(false);
          found += 1;
        }
      }
    }
    // 没找到同序号的跨年对 ⇒ 这条用例等于没验证，直接判失败
    expect(found).toBeGreaterThan(0);
  });

  it('同一周且同年 ⇒ 相等', () => {
    expect(isSameWeek(g, 'zh_CN', D('2026-09-14'), D('2026-09-19'))).toBe(true);
    expect(isSameWeek(g, 'zh_CN', D('2026-09-14'), D('2026-09-21'))).toBe(false);
  });

  it('空值通道：两边都空相等，只有一边空不等', () => {
    expect(isSameWeek(g, 'zh_CN', null, null)).toBe(true);
    expect(isSameWeek(g, 'zh_CN', null, D('2026-09-19'))).toBe(false);
    expect(isSameWeek(g, 'zh_CN', D('2026-09-19'), undefined)).toBe(false);
  });
});
