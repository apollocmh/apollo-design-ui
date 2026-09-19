/**
 * dayjs 适配层对 `@rc-component/picker@1.12.2` 的 `es/generate/dayjs.js` 差分。
 *
 * 作用（契约 §4.3）：把 §4.2 的 date-util 差分**归因**。若适配层本身逐位一致，
 * 那么上层差分一旦红，根因就一定在语义函数里，不必再二分。
 *
 * ⚠️ 上游 `es/generate/dayjs.js` 只 import dayjs 及其插件，**零 React** ⇒ 可对拍。
 */

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import { describe, expect, it } from 'vitest';
import 'dayjs/locale/zh-cn';
// ⚠️ 必须再加载一个**不在 localeMap 里**的 locale（fr_FR ⇒ 'fr'）：
// 否则 `parseLocale` 的 fallback 分支两侧都落到「dayjs 未注册 ⇒ 回退 en」，
// 变异验证里「去掉 fallback」这个变异体会存活（实测）。
import 'dayjs/locale/fr';

import upGenerateConfig from '../../oracle/upstream/generate-dayjs.js';
import { dayjsGenerateConfig as ourG } from '../generate/dayjs';

dayjs.extend(updateLocale);

const POOL: Dayjs[] = [];
let seed = 987654321;
const next = (): number => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x1_0000_0000;
};
for (let i = 0; i < 60; i += 1) {
  POOL.push(
    dayjs(
      new Date(
        1970 + Math.floor(next() * 131),
        Math.floor(next() * 12),
        1 + Math.floor(next() * 28),
        Math.floor(next() * 24),
        Math.floor(next() * 60),
        Math.floor(next() * 60),
        Math.floor(next() * 1000),
      ),
    ),
  );
}

const LOCALE_CODES = ['en_US', 'zh_CN', 'en_GB', 'fr_FR', 'pt_BR', 'by_BY', 'kmr_IQ'];

describe('generate/dayjs · Oracle 差分（@rc-component/picker@1.12.2）', () => {
  it('八个 getter 逐位一致', () => {
    for (const d of POOL) {
      expect(ourG.getYear(d)).toBe(upGenerateConfig.getYear(d));
      expect(ourG.getMonth(d)).toBe(upGenerateConfig.getMonth(d));
      expect(ourG.getDate(d)).toBe(upGenerateConfig.getDate(d));
      expect(ourG.getHour(d)).toBe(upGenerateConfig.getHour(d));
      expect(ourG.getMinute(d)).toBe(upGenerateConfig.getMinute(d));
      expect(ourG.getSecond(d)).toBe(upGenerateConfig.getSecond(d));
      expect(ourG.getMillisecond(d)).toBe(upGenerateConfig.getMillisecond(d));
      expect(ourG.getWeekDay(d)).toBe(upGenerateConfig.getWeekDay(d));
    }
  });

  it('getFixedDate / getEndDate 逐位一致', () => {
    for (const text of ['2026-09-19', '2026-1-5', '1999-12-31']) {
      expect(ourG.getFixedDate(text).valueOf()).toBe(upGenerateConfig.getFixedDate(text).valueOf());
    }
    for (const d of POOL) {
      expect(ourG.getEndDate(d).valueOf()).toBe(upGenerateConfig.getEndDate(d).valueOf());
    }
  });

  it('addYear / addMonth / addDate 逐位一致（含负数）', () => {
    for (const d of POOL) {
      for (const diff of [-400, -13, -1, 0, 1, 7, 30, 400]) {
        expect(ourG.addYear(d, diff).valueOf()).toBe(upGenerateConfig.addYear(d, diff).valueOf());
        expect(ourG.addMonth(d, diff).valueOf()).toBe(upGenerateConfig.addMonth(d, diff).valueOf());
        expect(ourG.addDate(d, diff).valueOf()).toBe(upGenerateConfig.addDate(d, diff).valueOf());
      }
    }
  });

  it('七个 setter 逐位一致', () => {
    for (const d of POOL.slice(0, 30)) {
      expect(ourG.setYear(d, 2000).valueOf()).toBe(upGenerateConfig.setYear(d, 2000).valueOf());
      expect(ourG.setMonth(d, 1).valueOf()).toBe(upGenerateConfig.setMonth(d, 1).valueOf());
      expect(ourG.setDate(d, 29).valueOf()).toBe(upGenerateConfig.setDate(d, 29).valueOf());
      expect(ourG.setHour(d, 23).valueOf()).toBe(upGenerateConfig.setHour(d, 23).valueOf());
      expect(ourG.setMinute(d, 59).valueOf()).toBe(upGenerateConfig.setMinute(d, 59).valueOf());
      expect(ourG.setSecond(d, 0).valueOf()).toBe(upGenerateConfig.setSecond(d, 0).valueOf());
      expect(ourG.setMillisecond(d, 123).valueOf()).toBe(
        upGenerateConfig.setMillisecond(d, 123).valueOf(),
      );
    }
  });

  it('isAfter / isValidate 逐位一致', () => {
    for (let i = 0; i < POOL.length; i += 1) {
      const a = POOL[i] as Dayjs;
      const b = POOL[(i + 7) % POOL.length] as Dayjs;
      expect(ourG.isAfter(a, b)).toBe(upGenerateConfig.isAfter(a, b));
      expect(ourG.isAfter(b, a)).toBe(upGenerateConfig.isAfter(b, a));
      expect(ourG.isValidate(a)).toBe(upGenerateConfig.isValidate(a));
    }
    expect(ourG.isValidate(dayjs('not-a-date'))).toBe(
      upGenerateConfig.isValidate(dayjs('not-a-date')),
    );
  });

  it('locale.getWeekFirstDay / getWeek / getWeekFirstDate 逐位一致', () => {
    for (const code of LOCALE_CODES) {
      expect(ourG.locale.getWeekFirstDay(code)).toBe(upGenerateConfig.locale.getWeekFirstDay(code));
      for (const d of POOL) {
        expect(ourG.locale.getWeek(code, d)).toBe(upGenerateConfig.locale.getWeek(code, d));
        expect(ourG.locale.getWeekFirstDate(code, d).valueOf()).toBe(
          upGenerateConfig.locale.getWeekFirstDate(code, d).valueOf(),
        );
      }
    }
  });

  it('locale.format / getShortWeekDays / getShortMonths 逐位一致', () => {
    const formats = ['YYYY-MM-DD', 'dddd', 'MMMM', 'wo', 'Wo'];
    for (const code of LOCALE_CODES) {
      for (const format of formats) {
        for (const d of POOL.slice(0, 20)) {
          expect(ourG.locale.format(code, d, format)).toBe(
            upGenerateConfig.locale.format(code, d, format),
          );
        }
      }
      expect(ourG.locale.getShortWeekDays?.(code)).toEqual(
        upGenerateConfig.locale.getShortWeekDays?.(code),
      );
      expect(ourG.locale.getShortMonths?.(code)).toEqual(
        upGenerateConfig.locale.getShortMonths?.(code),
      );
    }
  });

  it('locale.parse 逐位一致（含 wo 的 52 次试算与不匹配的 null）', () => {
    const cases: [string, string, string[]][] = [
      ['en_US', '2026-09-19', ['YYYY-MM-DD']],
      ['en_US', '2026/09/19', ['YYYY-MM-DD', 'YYYY/MM/DD']],
      ['zh_CN', '2026-09-19', ['YYYY-MM-DD']],
      ['en_US', 'not-a-date', ['YYYY-MM-DD']],
      ['en_US', '2026-01', ['YYYY-wo']],
      ['en_US', '2026-52', ['YYYY-Wo']],
    ];
    for (const [code, text, formats] of cases) {
      const ours = ourG.locale.parse(code, text, formats);
      const theirs = upGenerateConfig.locale.parse(code, text, formats);
      if (ours === null || theirs === null) {
        expect(ours).toBe(theirs);
      } else {
        expect(ours.valueOf()).toBe(theirs.valueOf());
      }
    }
  });

  it('⭐ getWeekDay 的 `+ firstDayOfWeek()` 在 en 被改成非周日起始时才可观测', () => {
    // 默认 en 是周日为首（0），所以 `+ firstDayOfWeek()` 恒等于 `+ 0`
    // ⇒ 「去掉这一项」是一个**等价变异体**，除非把 en 的 weekStart 改掉。
    const enStart = ourG.locale.getWeekFirstDay('en');
    expect(enStart).toBe(0);
    try {
      dayjs.updateLocale('en', { weekStart: 2 });
      const d = POOL[0] as Dayjs;
      expect(ourG.getWeekDay(d)).toBe(upGenerateConfig.getWeekDay(d));
      expect(ourG.getWeekDay(d)).not.toBe(
        // 变异体（去掉 `+ firstDayOfWeek()`）会得到的值
        d.locale('en').weekday(),
      );
    } finally {
      dayjs.updateLocale('en', { weekStart: 0 });
    }
  });

  it('getNow 返回有效日期（不逐位比对 —— 它依赖当前时刻）', () => {
    expect(ourG.getNow().isValid()).toBe(true);
    expect(upGenerateConfig.getNow().isValid()).toBe(true);
  });
});
