/**
 * `panel`（几何 + 格子状态）的**行为测试**。
 *
 * ⚠️ **没有 Oracle**：上游 `PanelBody.js` 与六个面板组件都 `import * as React`
 * （契约 §4.1）⇒ 这里的所有断言都来自**读源码**得到的规格（契约 §3.4），
 * 不是两侧对拍。强度低于 oracle，但每一条都注明了上游行号。
 */

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import 'dayjs/locale/zh-cn';

import { dayjsGenerateConfig as g } from '../generate/dayjs';
import { buildPanelCells, getPanelGeometry, getRowStartDate } from '../panel';
import type { PickerLocale } from '../types';

const NOW = dayjs(new Date(2026, 8, 19, 12, 0, 0, 0)); // 2026-09-19 12:00
const PV = dayjs(new Date(2026, 8, 19, 12, 0, 0, 0));

const LOCALE: PickerLocale = {
  locale: 'zh_CN',
  fieldDateFormat: 'YYYY-MM-DD',
  fieldMonthFormat: 'YYYY-MM',
  fieldYearFormat: 'YYYY',
  fieldQuarterFormat: 'YYYY-Q',
  cellDateFormat: 'D',
  cellYearFormat: 'YYYY',
  cellQuarterFormat: 'Q',
  shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  shortWeekDays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
};

const ctx = { generateConfig: g, locale: LOCALE, pickerValue: PV, now: NOW };
const fmt = (d: Dayjs): string => d.format('YYYY-MM-DD');

describe('getPanelGeometry · date 面板（DatePanel/index.js:28-31,159-175）', () => {
  it('6×7，首格是本周起始日', () => {
    const geo = getPanelGeometry('date', ctx);
    expect(geo.rowNum).toBe(6);
    expect(geo.colNum).toBe(7);
    expect(geo.cellSelection).toBe(true);
    expect(geo.titleFormat).toBe('YYYY-MM-DD');
    // zh_CN 周一为首 ⇒ 2026-09-01 是周二 ⇒ 首格回退到 2026-08-31（周一）
    expect(fmt(geo.baseDate)).toBe('2026-08-31');
  });

  it('en_US 下首格是周日（同一不变量，换个 locale 验证）', () => {
    const geo = getPanelGeometry('date', {
      ...ctx,
      locale: { ...LOCALE, locale: 'en_US' },
    });
    expect(fmt(geo.baseDate)).toBe('2026-08-30');
  });

  it('线性 offset ⇒ 连续日期（不是「本行第 col 个」）', () => {
    const geo = getPanelGeometry('date', ctx);
    expect(fmt(geo.getCellDate(geo.baseDate, 7))).toBe('2026-09-07');
    expect(fmt(geo.getCellDate(geo.baseDate, 41))).toBe('2026-10-11');
  });

  it('cell 文案用 cellDateFormat，in-view 只落在本月，today 落在 9/19', () => {
    const geo = getPanelGeometry('date', ctx);
    const state0 = geo.getCellState?.(geo.baseDate);
    expect(state0?.inView).toBe(false); // 8-31 属于上月
    expect(state0?.today).toBe(false);

    const sep19 = geo.getCellDate(geo.baseDate, 19);
    const state19 = geo.getCellState?.(sep19);
    expect(fmt(sep19)).toBe('2026-09-19');
    expect(state19?.inView).toBe(true);
    expect(state19?.today).toBe(true);
    expect(geo.getCellText(sep19)).toBe('19');
  });
});

describe('getPanelGeometry · week 面板（WeekPanel/index.js + DatePanel:174）', () => {
  it('几何与 date 完全相同，只是 cellSelection 为 false', () => {
    const date = getPanelGeometry('date', ctx);
    const week = getPanelGeometry('week', ctx);
    expect(week.rowNum).toBe(date.rowNum);
    expect(week.colNum).toBe(date.colNum);
    expect(fmt(week.baseDate)).toBe(fmt(date.baseDate));
    expect(week.cellSelection).toBe(false);
  });
});

describe('getPanelGeometry · month / quarter / year / decade', () => {
  it('month：4×3，首格是一月，12 格走到十二月', () => {
    const geo = getPanelGeometry('month', ctx);
    expect([geo.rowNum, geo.colNum]).toEqual([4, 3]);
    expect(fmt(geo.baseDate)).toBe('2026-01-19');
    expect(fmt(geo.getCellDate(geo.baseDate, 11))).toBe('2026-12-19');
    expect(geo.getCellText(geo.baseDate)).toBe('Jan');
    expect(geo.getCellState?.(geo.baseDate)?.inView).toBe(true);
  });

  it('month：有 monthFormat 时走 formatValue 而不是 shortMonths', () => {
    const geo = getPanelGeometry('month', {
      ...ctx,
      locale: { ...LOCALE, monthFormat: 'YYYY-MM' },
    });
    expect(geo.getCellText(geo.baseDate)).toBe('2026-01');
  });

  it('quarter：1×4，步长是 3 个月', () => {
    const geo = getPanelGeometry('quarter', ctx);
    expect([geo.rowNum, geo.colNum]).toEqual([1, 4]);
    expect(fmt(geo.baseDate)).toBe('2026-01-19');
    expect([
      geo.getCellText(geo.getCellDate(geo.baseDate, 0)),
      geo.getCellText(geo.getCellDate(geo.baseDate, 1)),
      geo.getCellText(geo.getCellDate(geo.baseDate, 2)),
      geo.getCellText(geo.getCellDate(geo.baseDate, 3)),
    ]).toEqual(['1', '2', '3', '4']);
  });

  it('year：4×3，首格是「十年起点 − 1」', () => {
    const geo = getPanelGeometry('year', ctx);
    expect([geo.rowNum, geo.colNum]).toEqual([4, 3]);
    // 2026 ⇒ 十年起点 2020 ⇒ 首格 2019
    expect(fmt(geo.baseDate)).toBe('2019-09-19');
    expect(fmt(geo.getCellDate(geo.baseDate, 11))).toBe('2030-09-19');
    // in-view：2020..2029 在视野内，2019 与 2030 不在
    expect(geo.getCellState?.(geo.baseDate)?.inView).toBe(false);
    expect(geo.getCellState?.(geo.getCellDate(geo.baseDate, 1))?.inView).toBe(true);
    expect(geo.getCellState?.(geo.getCellDate(geo.baseDate, 10))?.inView).toBe(true);
    expect(geo.getCellState?.(geo.getCellDate(geo.baseDate, 11))?.inView).toBe(false);
  });

  it('decade：4×3，首格是「世纪起点 − 10」，步长 10 年', () => {
    const geo = getPanelGeometry('decade', ctx);
    expect([geo.rowNum, geo.colNum]).toEqual([4, 3]);
    // 2026 ⇒ 世纪起点 2000 ⇒ 首格 1990
    expect(fmt(geo.baseDate)).toBe('1990-09-19');
    expect(fmt(geo.getCellDate(geo.baseDate, 1))).toBe('2000-09-19');
    expect(fmt(geo.getCellDate(geo.baseDate, 11))).toBe('2100-09-19');
    // 文案是「起始年-结束年」
    expect(geo.getCellText(geo.getCellDate(geo.baseDate, 1))).toBe('2000-2009');
    // in-view：2000..2090
    expect(geo.getCellState?.(geo.baseDate)?.inView).toBe(false);
    expect(geo.getCellState?.(geo.getCellDate(geo.baseDate, 1))?.inView).toBe(true);
  });

  it('time 面板不走格子系统 ⇒ 显式抛错', () => {
    expect(() => getPanelGeometry('time', ctx)).toThrow(/不支持的面板模式/);
  });
});

describe('getPanelGeometry · locale 缺键时的兜底', () => {
  const BARE: PickerLocale = { locale: 'en_US' };
  const bareCtx = { ...ctx, locale: BARE };

  /**
   * ⚠️ 缺失 format 时**不是**空串，而是 dayjs 的默认 ISO —— 上游传的是 `undefined`，
   * dayjs 的 `format(falsy)` 同样回落到默认格式。两侧一致。
   */
  const defaultText = (d: Dayjs): string => g.locale.format('en_US', d, '');

  it('没有 cellDateFormat ⇒ 回落到 dayjs 默认格式', () => {
    const geo = getPanelGeometry('date', bareCtx);
    expect(geo.getCellText(PV)).toBe(defaultText(PV));
    expect(defaultText(PV)).toContain('2026-09-19');
  });

  it('没有 cellQuarterFormat ⇒ 回落到 dayjs 默认格式', () => {
    const geo = getPanelGeometry('quarter', bareCtx);
    expect(geo.getCellText(geo.baseDate)).toBe(defaultText(geo.baseDate));
  });

  it('没有 cellYearFormat ⇒ year / decade 同样回落（decade 仍是「起始-结束」）', () => {
    expect(getPanelGeometry('year', bareCtx).getCellText(PV)).toBe(defaultText(PV));

    const geo = getPanelGeometry('decade', bareCtx);
    const start = geo.getCellDate(geo.baseDate, 1);
    expect(geo.getCellText(start)).toBe(
      `${defaultText(start)}-${defaultText(g.addYear(start, 9))}`,
    );
  });

  it('没有 shortMonths ⇒ 回落到 generateConfig.locale.getShortMonths', () => {
    const geo = getPanelGeometry('month', bareCtx);
    expect(geo.getCellText(geo.baseDate)).toBe(g.locale.getShortMonths?.('en_US')?.[0]);
  });

  it('shortMonths 比 12 个短 ⇒ 越界的月份给空串', () => {
    const geo = getPanelGeometry('month', {
      ...ctx,
      locale: { locale: 'en_US', shortMonths: ['A', 'B', 'C'] },
    });
    expect(geo.getCellText(geo.baseDate)).toBe('A');
    // 第 4 个月（index 3）越界
    expect(geo.getCellText(geo.getCellDate(geo.baseDate, 3))).toBe('');
  });
});

describe('getRowStartDate', () => {
  it('取每行第一格（week 面板的周号列靠它）', () => {
    const geo = getPanelGeometry('date', ctx);
    expect(fmt(getRowStartDate(geo, 0))).toBe('2026-08-31');
    expect(fmt(getRowStartDate(geo, 1))).toBe('2026-09-07');
  });
});

describe('buildPanelCells · 状态位（PanelBody.js:56-102）', () => {
  const cellsCtx = {
    generateConfig: g,
    locale: LOCALE,
    mode: 'date' as const,
    now: NOW,
    values: [] as Dayjs[],
  };

  it('输出 6×7 的二维数组，offset 是线性下标', () => {
    const rows = buildPanelCells(getPanelGeometry('date', ctx), cellsCtx);
    expect(rows).toHaveLength(6);
    expect(rows[0]).toHaveLength(7);
    expect(rows[5]?.[6]?.offset).toBe(41);
    expect(rows[5]?.[6]?.row).toBe(5);
    expect(rows[5]?.[6]?.col).toBe(6);
    expect(fmt(rows[0]?.[0]?.date as Dayjs)).toBe('2026-08-31');
  });

  it('selected：命中 values 的那一格为 true', () => {
    const rows = buildPanelCells(getPanelGeometry('date', ctx), {
      ...cellsCtx,
      values: [dayjs(new Date(2026, 8, 19))],
    });
    const hit = rows.flat().filter((cell) => cell.selected);
    expect(hit).toHaveLength(1);
    expect(fmt(hit[0]?.date as Dayjs)).toBe('2026-09-19');
  });

  it('hovered / disabled 都来自注入', () => {
    const rows = buildPanelCells(getPanelGeometry('date', ctx), {
      ...cellsCtx,
      hoverValue: [dayjs(new Date(2026, 8, 3))],
      disabledDate: (date) => g.getDate(date) === 5,
    });
    const hovered = rows.flat().filter((cell) => cell.hovered);
    expect(hovered).toHaveLength(1);
    expect(fmt(hovered[0]?.date as Dayjs)).toBe('2026-09-03');
    // 9/5 与 10/5 都在 6×7 网格里
    const disabled = rows.flat().filter((cell) => cell.disabled);
    expect(disabled.map((cell) => fmt(cell.date))).toEqual(['2026-09-05', '2026-10-05']);
  });

  it('range 三态：start / end / in-range（in-range 不含端点）', () => {
    const rows = buildPanelCells(getPanelGeometry('date', ctx), {
      ...cellsCtx,
      hoverRangeValue: [dayjs(new Date(2026, 8, 5)), dayjs(new Date(2026, 8, 9))] as [Dayjs, Dayjs],
    });
    const flat = rows.flat();
    expect(flat.filter((cell) => cell.rangeStart).map((c) => fmt(c.date))).toEqual(['2026-09-05']);
    expect(flat.filter((cell) => cell.rangeEnd).map((c) => fmt(c.date))).toEqual(['2026-09-09']);
    // 开区间：6/7/8 三天
    expect(flat.filter((cell) => cell.inRange).map((c) => fmt(c.date))).toEqual([
      '2026-09-06',
      '2026-09-07',
      '2026-09-08',
    ]);
  });

  it('⭐ hover 预览期间 selected 让位给 range 标（PanelBody:99）', () => {
    const selected = dayjs(new Date(2026, 8, 19));
    const withRange = buildPanelCells(getPanelGeometry('date', ctx), {
      ...cellsCtx,
      values: [selected],
      hoverRangeValue: [dayjs(new Date(2026, 8, 5)), dayjs(new Date(2026, 8, 9))] as [Dayjs, Dayjs],
    });
    // 有 hoverRangeValue ⇒ 一格都不标 selected
    expect(withRange.flat().filter((cell) => cell.selected)).toHaveLength(0);
    // 没有 hoverRangeValue ⇒ 正常标
    const withoutRange = buildPanelCells(getPanelGeometry('date', ctx), {
      ...cellsCtx,
      values: [selected],
    });
    expect(withoutRange.flat().filter((cell) => cell.selected)).toHaveLength(1);
  });

  it('week 模式下 selected 恒为 false（PanelBody:100-101 的 type !== "week"）', () => {
    const rows = buildPanelCells(getPanelGeometry('week', ctx), {
      ...cellsCtx,
      mode: 'week',
      values: [dayjs(new Date(2026, 8, 19))],
    });
    expect(rows.flat().filter((cell) => cell.selected)).toHaveLength(0);
  });

  it('week 模式下 range 三态也不计算（cellSelection 为 false）', () => {
    const rows = buildPanelCells(getPanelGeometry('week', ctx), {
      ...cellsCtx,
      mode: 'week',
      hoverRangeValue: [dayjs(new Date(2026, 8, 5)), dayjs(new Date(2026, 8, 9))] as [Dayjs, Dayjs],
    });
    const flat = rows.flat();
    expect(flat.filter((c) => c.rangeStart)).toHaveLength(0);
    expect(flat.filter((c) => c.rangeEnd)).toHaveLength(0);
    expect(flat.filter((c) => c.inRange)).toHaveLength(0);
  });

  it('title 由 titleFormat 决定；decade 面板没有 titleFormat', () => {
    const withTitle = buildPanelCells(getPanelGeometry('date', ctx), cellsCtx);
    expect(withTitle[0]?.[0]?.title).toBe('2026-08-31');

    const decade = buildPanelCells(getPanelGeometry('decade', ctx), {
      ...cellsCtx,
      mode: 'decade',
    });
    expect(decade[0]?.[0]?.title).toBeUndefined();
  });

  it('in-view / today 落到格子上', () => {
    const rows = buildPanelCells(getPanelGeometry('date', ctx), cellsCtx);
    const flat = rows.flat();
    expect(flat.filter((cell) => cell.today).map((c) => fmt(c.date))).toEqual(['2026-09-19']);
    expect(flat.filter((cell) => cell.inView)).toHaveLength(30); // 9 月有 30 天
  });
});
