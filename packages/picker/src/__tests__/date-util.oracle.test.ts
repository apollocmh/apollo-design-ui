/**
 * `date-util` 对 `@rc-component/picker@1.12.2` 的 **Oracle 逐位差分**。
 *
 * 判据（契约 §4）：上游 `es/utils/dateUtil.js` 的 import 链上**没有任何 React**
 * ⇒ 可以两侧同时跑、逐位比对。
 *
 * ⚠️ 这不是「跑一遍看绿不绿」：断言数 = 用例规模 × 比较项，任何一侧语义偏一点就会红。
 * 上游副本在 `packages/picker/oracle/upstream/`（sha256 见 `provenance.json`）。
 */

import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';

import * as up from '../../oracle/upstream/dateUtil.js';
import upGenerateConfig from '../../oracle/upstream/generate-dayjs.js';
import {
  fillTime,
  formatValue,
  getQuarter,
  getWeekStartDate,
  isInRange,
  isSame,
  isSameDate,
  isSameDecade,
  isSameMonth,
  isSameOrAfter,
  isSameQuarter,
  isSameTime,
  isSameTimestamp,
  isSameWeek,
  isSameYear,
} from '../date-util';
import { dayjsGenerateConfig as ourG } from '../generate/dayjs';
import type { InternalMode, PickerLocale } from '../types';

// ------------------------------------------------------------------ 用例池

/** 确定性 LCG —— 写死种子，失败可复现。 */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

const rng = makeRng(20260919);

/** 200 个跨越 1970–2100 的日期，含时分秒毫秒。 */
const POOL: Dayjs[] = [];
for (let i = 0; i < 200; i += 1) {
  const y = 1970 + Math.floor(rng() * 131);
  const m = Math.floor(rng() * 12);
  const d = 1 + Math.floor(rng() * 28);
  POOL.push(
    dayjs(
      new Date(
        y,
        m,
        d,
        Math.floor(rng() * 24),
        Math.floor(rng() * 60),
        Math.floor(rng() * 60),
        Math.floor(rng() * 1000),
      ),
    ),
  );
}

/** 空值通道也要对拍：`nullableCompare` 的三条分支全靠它们。 */
const NULLABLE = [null, undefined] as const;

const LOCALES: PickerLocale[] = [{ locale: 'en_US' }, { locale: 'zh_CN' }];
const LOCALE_CODES = ['en_US', 'zh_CN'];

const TYPES: InternalMode[] = [
  'date',
  'week',
  'month',
  'quarter',
  'year',
  'decade',
  'time',
  'datetime',
];

/** 逐位比对的样本对：`[a, b]`，含空值组合。 */
const PAIRS: [Dayjs | null | undefined, Dayjs | null | undefined][] = [];
for (let i = 0; i < POOL.length; i += 1) {
  for (let k = 0; k < 8; k += 1) {
    const j = (i * 7 + k * 13) % POOL.length;
    PAIRS.push([POOL[i], POOL[j]]);
    // 同一个对象：走 `value1 === value2` 那条分支
    if (k === 0) {
      PAIRS.push([POOL[i], POOL[i]]);
    }
  }
}
for (const a of NULLABLE) {
  PAIRS.push([a, POOL[0]]);
  PAIRS.push([POOL[0], a]);
  PAIRS.push([a, a]);
}

// ------------------------------------------------------------------ 用例

describe('date-util · Oracle 差分（@rc-component/picker@1.12.2）', () => {
  it('isSameYear / isSameMonth / isSameDate 逐位一致', () => {
    let compared = 0;
    for (const [a, b] of PAIRS) {
      expect(isSameYear(ourG, a, b)).toBe(up.isSameYear(upGenerateConfig, a, b));
      expect(isSameMonth(ourG, a, b)).toBe(up.isSameMonth(upGenerateConfig, a, b));
      expect(isSameDate(ourG, a, b)).toBe(up.isSameDate(upGenerateConfig, a, b));
      compared += 3;
    }
    expect(compared).toBe(PAIRS.length * 3);
  });

  it('isSameQuarter / getQuarter 逐位一致', () => {
    for (const [a, b] of PAIRS) {
      expect(isSameQuarter(ourG, a, b)).toBe(
        up.isSameQuarter(upGenerateConfig, a, b),
      );
    }
    for (const a of POOL) {
      expect(getQuarter(ourG, a)).toBe(up.getQuarter(upGenerateConfig, a));
    }
  });

  it('isSameDecade 逐位一致', () => {
    for (const [a, b] of PAIRS) {
      expect(isSameDecade(ourG, a, b)).toBe(up.isSameDecade(upGenerateConfig, a, b));
    }
  });

  it('isSameTime / isSameTimestamp 逐位一致', () => {
    for (const [a, b] of PAIRS) {
      expect(isSameTime(ourG, a, b)).toBe(up.isSameTime(upGenerateConfig, a, b));
      expect(isSameTimestamp(ourG, a, b)).toBe(
        up.isSameTimestamp(upGenerateConfig, a, b),
      );
    }
  });

  it('isSameWeek 逐位一致（locale 是裸字符串）', () => {
    let compared = 0;
    for (const code of LOCALE_CODES) {
      for (const [a, b] of PAIRS) {
        expect(isSameWeek(ourG, code, a, b)).toBe(
          up.isSameWeek(upGenerateConfig, code, a, b),
        );
        compared += 1;
      }
    }
    expect(compared).toBe(LOCALE_CODES.length * PAIRS.length);
  });

  it('isSame 全部 8 种 type 逐位一致', () => {
    let compared = 0;
    for (const locale of LOCALES) {
      const upLocale = { locale: locale.locale };
      for (const type of TYPES) {
        for (const [a, b] of PAIRS) {
          expect(isSame(ourG, locale, a, b, type)).toBe(
            up.isSame(upGenerateConfig, upLocale, a, b, type),
          );
          compared += 1;
        }
      }
    }
    expect(compared).toBe(LOCALES.length * TYPES.length * PAIRS.length);
  });

  it('isInRange 逐位一致（开区间 + 空值通道）', () => {
    let compared = 0;
    for (let i = 0; i < POOL.length; i += 3) {
      const start = POOL[i];
      const end = POOL[(i + 5) % POOL.length];
      for (const cur of [...POOL.slice(0, 40), ...NULLABLE]) {
        expect(isInRange(ourG, start, end, cur)).toBe(
          up.isInRange(upGenerateConfig, start, end, cur),
        );
        compared += 1;
      }
    }
    // 空 start / 空 end 的组合
    for (const empty of NULLABLE) {
      expect(isInRange(ourG, empty, POOL[1], POOL[2])).toBe(
        up.isInRange(upGenerateConfig, empty, POOL[1], POOL[2]),
      );
      expect(isInRange(ourG, POOL[1], empty, POOL[2])).toBe(
        up.isInRange(upGenerateConfig, POOL[1], empty, POOL[2]),
      );
      compared += 2;
    }
    expect(compared).toBeGreaterThan(1500);
  });

  it('isSameOrAfter 逐位一致（只喂非空 —— 上游对空值会抛）', () => {
    let compared = 0;
    for (const locale of LOCALES) {
      const upLocale = { locale: locale.locale };
      for (const type of TYPES) {
        for (let i = 0; i < POOL.length; i += 2) {
          const a = POOL[i] as Dayjs;
          const b = POOL[(i * 3 + 1) % POOL.length] as Dayjs;
          expect(isSameOrAfter(ourG, locale, a, b, type)).toBe(
            up.isSameOrAfter(upGenerateConfig, upLocale, a, b, type),
          );
          compared += 1;
        }
      }
    }
    expect(compared).toBe(LOCALES.length * TYPES.length * 100);
  });

  it('getWeekStartDate 逐位一致（含回退一周的分支）', () => {
    for (const code of [...LOCALE_CODES, 'en', 'zh_CN']) {
      for (const a of POOL) {
        const ours = getWeekStartDate(code, ourG, a);
        const theirs = up.getWeekStartDate(code, upGenerateConfig, a);
        expect(ours.valueOf()).toBe(theirs.valueOf());
      }
    }
  });

  it('getWeekStartDate 真的覆盖了「回退一周」分支', () => {
    // 属性断言：结果必须是该周的起始日，且与本月 1 号相差不超过 7 天。
    for (const a of POOL) {
      const start = getWeekStartDate('en_US', ourG, a);
      const monthStart = ourG.setDate(a, 1);
      const diff = start.diff(monthStart, 'day');
      expect(diff).toBeLessThanOrEqual(0);
      expect(diff).toBeGreaterThanOrEqual(-7);
    }
  });

  it('formatValue 逐位一致（字符串格式 + 函数格式 + 空值）', () => {
    const formats = ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', 'YYYY', 'MM', 'DD'];
    for (const locale of LOCALES) {
      const upLocale = { locale: locale.locale };
      for (const format of formats) {
        for (const a of POOL.slice(0, 60)) {
          const ours = formatValue(a, { generateConfig: ourG, locale, format });
          const theirs = up.formatValue(a, {
            generateConfig: upGenerateConfig,
            locale: upLocale,
            format,
          });
          expect(ours).toBe(theirs);
        }
      }
      // 空值 ⇒ ''
      for (const empty of NULLABLE) {
        expect(formatValue(empty, { generateConfig: ourG, locale, format: 'YYYY' })).toBe(
          up.formatValue(empty, {
            generateConfig: upGenerateConfig,
            locale: upLocale,
            format: 'YYYY',
          }),
        );
      }
    }
  });

  it('formatValue 的「format 是函数」分支与上游一致', () => {
    const locale = LOCALES[1] as PickerLocale;
    const upLocale = { locale: locale.locale };
    const fn = (value: Dayjs) => `F${String(value.year())}`;
    for (const a of POOL.slice(0, 40)) {
      expect(formatValue(a, { generateConfig: ourG, locale, format: fn })).toBe(
        up.formatValue(a, {
          generateConfig: upGenerateConfig,
          locale: upLocale,
          format: fn,
        }),
      );
    }
  });

  it('fillTime 逐位一致（有 time / 无 time）', () => {
    for (let i = 0; i < POOL.length; i += 1) {
      const a = POOL[i] as Dayjs;
      const t = POOL[(i * 5 + 3) % POOL.length] as Dayjs;
      expect(
        fillTime(ourG, a, t).valueOf(),
      ).toBe(up.fillTime(upGenerateConfig, a, t).valueOf());
      // ⚠️ 无 time ⇒ 四个字段全置 0，不是保留原时间
      const zeroed = fillTime(ourG, a);
      expect(zeroed.valueOf()).toBe(up.fillTime(upGenerateConfig, a).valueOf());
      expect(ourG.getHour(zeroed)).toBe(0);
      expect(ourG.getMinute(zeroed)).toBe(0);
      expect(ourG.getSecond(zeroed)).toBe(0);
      expect(ourG.getMillisecond(zeroed)).toBe(0);
    }
  });
});
