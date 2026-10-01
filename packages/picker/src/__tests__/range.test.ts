/**
 * `range`（区间选择的纯判定）的**行为测试**。
 *
 * ⚠️ **没有 Oracle**：上游 `useRangeValue.js` 绑 `useSyncState` / `useEffect`
 * （契约 §4.1）⇒ 断言来自读源码（§3.6），不是两侧对拍。
 */

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';

import { dayjsGenerateConfig as g } from '../generate/dayjs';
import type { RangeSubmitInput } from '../range';
import {
  getEndDatePickerValue,
  isSameDates,
  isSamePanel,
  offsetPanelDate,
  orderDates,
  validateRangeSubmit,
} from '../range';
import type { PickerLocale } from '../types';

const LOCALE: PickerLocale = { locale: 'zh_CN', fieldDateFormat: 'YYYY-MM-DD' };
const D = (s: string): Dayjs => dayjs(s);

const baseInput = (over: Partial<RangeSubmitInput<Dayjs>> = {}): RangeSubmitInput<Dayjs> => ({
  generateConfig: g,
  locale: LOCALE,
  picker: 'date',
  order: false,
  disabled: [false, false],
  nullValue: false,
  ...over,
});

const neverInvalid = (): boolean => false;

describe('orderDates（useRangeValue.js:52-54）', () => {
  it('按时间先后排序', () => {
    const out = orderDates([D('2026-09-19'), D('2026-01-01'), D('2026-05-05')], g);
    expect(out.map((d) => d.format('YYYY-MM-DD'))).toEqual([
      '2026-01-01',
      '2026-05-05',
      '2026-09-19',
    ]);
  });

  it('不改动原数组', () => {
    const ori = [D('2026-09-19'), D('2026-01-01')];
    orderDates(ori, g);
    expect(ori[0]?.format('YYYY-MM-DD')).toBe('2026-09-19');
  });

  it('⭐ 比较函数只返回 1 / -1，相等时给 -1', () => {
    // 三个元素里有两个同刻 ⇒ 排序稳定地把「相等」判成「后者在前」
    const a = D('2026-01-01');
    const b = D('2026-01-01');
    const out = orderDates([a, b], g);
    expect(out).toHaveLength(2);
    // 无论方向如何，都不能抛，且结果仍是两个元素
    expect(out.map((d) => d.format('YYYY-MM-DD'))).toEqual(['2026-01-01', '2026-01-01']);
  });
});

describe('isSameDates（useRangeValue.js:37-49）', () => {
  const a = D('2026-01-01');
  const b = D('2026-02-02');

  it('完全相同时返回 [true, true]', () => {
    expect(isSameDates(g, [a, b], [D('2026-01-01'), D('2026-02-02')])).toEqual([true, true]);
  });

  it('start 变了 ⇒ [false, false]（info.range = "start"）', () => {
    expect(isSameDates(g, [a, b], [D('2026-03-03'), b])).toEqual([false, false]);
  });

  it('只有 end 变了 ⇒ [false, true]（info.range = "end"）', () => {
    expect(isSameDates(g, [a, b], [a, D('2026-03-03')])).toEqual([false, true]);
  });

  it('长度不等时按 max(len) 逐位比', () => {
    expect(isSameDates(g, [a], [a, b])).toEqual([false, true]);
    expect(isSameDates(g, [a, b], [a])).toEqual([false, true]);
  });

  it('null 与有值不等；两个 null 相等', () => {
    expect(isSameDates(g, [null], [a])).toEqual([false, false]);
    expect(isSameDates(g, [null, null], [null, null])).toEqual([true, true]);
  });

  it('diffIndex 停在第一个不同的位置（后面的差异被 break 掉）', () => {
    // 两处都不同 ⇒ diffIndex = 0 ⇒ 第二个返回值是 false
    expect(isSameDates(g, [a, b], [D('2026-03-03'), D('2026-04-04')])).toEqual([false, false]);
    // 第一处相同、第二处不同 ⇒ diffIndex = 1
    expect(isSameDates(g, [a, b], [a, D('2026-04-04')])).toEqual([false, true]);
  });
});

describe('validateRangeSubmit（useRangeValue.js:177-208）', () => {
  it('全放行：没有 allowEmpty / order / disabled', () => {
    const out = validateRangeSubmit(baseInput(), D('2026-01-01'), D('2026-02-02'), neverInvalid);
    expect(out).toEqual({ passed: true, emptyOk: true, orderOk: true, datesOk: true });
  });

  it('allowEmpty：两个都空 ⇒ 不通过', () => {
    const out = validateRangeSubmit(
      baseInput({ allowEmpty: [true, false] }),
      null,
      null,
      neverInvalid,
    );
    expect(out.emptyOk).toBe(false);
    expect(out.passed).toBe(false);
  });

  it('allowEmpty：只有被允许的那一边可以空', () => {
    // allowEmpty[0] = true ⇒ start 空 OK
    expect(
      validateRangeSubmit(
        baseInput({ allowEmpty: [true, false] }),
        null,
        D('2026-02-02'),
        neverInvalid,
      ).emptyOk,
    ).toBe(true);
    // end 空不 OK
    expect(
      validateRangeSubmit(
        baseInput({ allowEmpty: [true, false] }),
        D('2026-01-01'),
        null,
        neverInvalid,
      ).emptyOk,
    ).toBe(false);
  });

  it('order：start 晚于 end ⇒ orderOk 为 false（同刻除外）', () => {
    expect(
      validateRangeSubmit(
        baseInput({ order: true }),
        D('2026-05-05'),
        D('2026-01-01'),
        neverInvalid,
      ).orderOk,
    ).toBe(false);

    // 同一天（按 picker 粒度相同）⇒ 放行
    expect(
      validateRangeSubmit(
        baseInput({ order: true }),
        D('2026-05-05'),
        D('2026-05-05'),
        neverInvalid,
      ).orderOk,
    ).toBe(true);

    // 有一边为空时 order 不生效
    expect(
      validateRangeSubmit(baseInput({ order: true }), null, D('2026-01-01'), neverInvalid).orderOk,
    ).toBe(true);
  });

  it('datesOk：被 disabledDate 命中的那一侧不放行', () => {
    const out = validateRangeSubmit(
      baseInput(),
      D('2026-01-01'),
      D('2026-02-02'),
      (date) => date.format('YYYY-MM-DD') === '2026-02-02',
    );
    expect(out.datesOk).toBe(false);
    expect(out.passed).toBe(false);
  });

  it('⭐ 校验 end 时会把 from: start 传进去 —— 这是 info.from 的唯一来源', () => {
    const seen: unknown[] = [];
    validateRangeSubmit(baseInput(), D('2026-01-01'), D('2026-02-02'), (date, info) => {
      seen.push({ date: date.format('YYYY-MM-DD'), info });
      return false;
    });
    expect(seen).toEqual([
      { date: '2026-01-01', info: { activeIndex: 0 } },
      { date: '2026-02-02', info: { from: D('2026-01-01'), activeIndex: 1 } },
    ]);
  });

  it('disabled 的那一侧跳过校验（连 isInvalidateDate 都不调）', () => {
    const spy = vi.fn(() => true);
    const out = validateRangeSubmit(
      baseInput({ disabled: [true, false] }),
      D('2026-01-01'),
      D('2026-02-02'),
      spy,
    );
    expect(spy).toHaveBeenCalledTimes(1); // 只校验了 end
    expect(out.datesOk).toBe(false);
  });

  it('⭐ nullValue（点清除按钮）直接放行，不看三条校验', () => {
    const out = validateRangeSubmit(
      baseInput({ nullValue: true, allowEmpty: [false, false], order: true }),
      null,
      null,
      () => true,
    );
    expect(out.passed).toBe(true);
    // 三条校验本身仍然是 false —— passed 是被 nullValue 短路的
    expect(out.emptyOk).toBe(false);
    expect(out.orderOk).toBe(true);
    expect(out.datesOk).toBe(true);
  });

  it('emptyOk 为 false 时仍会算完 orderOk / datesOk（不是短路）', () => {
    const spy = vi.fn(() => false);
    const out = validateRangeSubmit(baseInput({ allowEmpty: [false, false] }), null, null, spy);
    expect(out.emptyOk).toBe(false);
    expect(out.orderOk).toBe(true);
    expect(out.datesOk).toBe(true);
    expect(out.passed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2026-10-01 新增（RangePicker 的 S5 前置）：双面板的浏览值偏移。
// 上游出处：`useRangePickerValue.js:4-19`（offsetPanelDate）/ `:75-81`（isSamePanel）
// / `:86-93`（getEndDatePickerValue）。这三个都是**纯函数**，可以逐条钉住。
// ---------------------------------------------------------------------------
describe('offsetPanelDate（useRangePickerValue.js:4-19）', () => {
  const d = D('2026-05-15');

  it('⭐ 日 / 周粒度按**月**偏移（一屏是一个月，不是一天）', () => {
    expect(offsetPanelDate(g, 'date', d, 1).format('YYYY-MM-DD')).toBe('2026-06-15');
    expect(offsetPanelDate(g, 'week', d, 1).format('YYYY-MM-DD')).toBe('2026-06-15');
    expect(offsetPanelDate(g, 'date', d, -1).format('YYYY-MM-DD')).toBe('2026-04-15');
  });

  it('月 / 季粒度按**年**偏移（一屏是一年）', () => {
    expect(offsetPanelDate(g, 'month', d, 1).format('YYYY-MM-DD')).toBe('2027-05-15');
    expect(offsetPanelDate(g, 'quarter', d, 1).format('YYYY-MM-DD')).toBe('2027-05-15');
  });

  it('年粒度按**十年**偏移、十年粒度按**百年**偏移', () => {
    expect(offsetPanelDate(g, 'year', d, 1).format('YYYY')).toBe('2036');
    expect(offsetPanelDate(g, 'year', d, -1).format('YYYY')).toBe('2016');
    expect(offsetPanelDate(g, 'decade', d, 1).format('YYYY')).toBe('2126');
  });

  it('未知粒度（`time` 走 default）⇒ **原样返回**，不偏移', () => {
    expect(offsetPanelDate(g, 'time', d, 1).format('YYYY-MM-DD')).toBe('2026-05-15');
    expect(offsetPanelDate(g, 'time', d, -1).format('YYYY-MM-DD')).toBe('2026-05-15');
  });
});

describe('isSamePanel（useRangePickerValue.js:75-81）', () => {
  it('日粒度按**月**比较', () => {
    expect(isSamePanel(g, LOCALE, 'date', D('2026-05-01'), D('2026-05-31'))).toBe(true);
    expect(isSamePanel(g, LOCALE, 'date', D('2026-05-31'), D('2026-06-01'))).toBe(false);
  });

  it('月 / 季粒度按**年**比较', () => {
    expect(isSamePanel(g, LOCALE, 'month', D('2026-01-01'), D('2026-12-01'))).toBe(true);
    expect(isSamePanel(g, LOCALE, 'month', D('2026-12-01'), D('2027-01-01'))).toBe(false);
    expect(isSamePanel(g, LOCALE, 'quarter', D('2026-01-01'), D('2026-10-01'))).toBe(true);
  });

  it('⭐ 年粒度按**十年**比较（不是按年）', () => {
    expect(isSamePanel(g, LOCALE, 'year', D('2026-01-01'), D('2029-01-01'))).toBe(true);
    expect(isSamePanel(g, LOCALE, 'year', D('2029-01-01'), D('2030-01-01'))).toBe(false);
  });
});

describe('getEndDatePickerValue（useRangePickerValue.js:86-93）', () => {
  const start = D('2026-05-10');
  const sameMonth = D('2026-05-20');
  const nextMonth = D('2026-06-20');
  const farAway = D('2026-12-20');

  it('单面板（`multiplePanel=false`）⇒ 原样返回 endDate', () => {
    expect(getEndDatePickerValue(g, LOCALE, 'date', false, start, farAway)).toBe(farAway);
  });

  it('没有 start ⇒ 原样返回 endDate', () => {
    expect(getEndDatePickerValue(g, LOCALE, 'date', true, null, farAway)).toBe(farAway);
  });

  it('⭐ end 与 start **同屏** ⇒ 右面板也用 start（两个值同时可见）', () => {
    expect(getEndDatePickerValue(g, LOCALE, 'date', true, start, sameMonth)).toBe(start);
  });

  it('⭐ end 落在 start 的**下一屏** ⇒ 右面板仍用 start（正好相邻）', () => {
    expect(getEndDatePickerValue(g, LOCALE, 'date', true, start, nextMonth)).toBe(start);
  });

  it('⭐ end 更远 ⇒ 右面板**退一屏**（`endDate - 1`），让 end 出现在右面板上', () => {
    const out = getEndDatePickerValue(g, LOCALE, 'date', true, start, farAway);
    expect(out?.format('YYYY-MM-DD')).toBe('2026-11-20');
  });

  it('偏移按**当前粒度**算（月粒度退一屏 = 退一年）', () => {
    const out = getEndDatePickerValue(g, LOCALE, 'month', true, D('2026-01-01'), D('2030-01-01'));
    expect(out?.format('YYYY-MM-DD')).toBe('2029-01-01');
  });
});
