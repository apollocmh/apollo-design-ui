/**
 * `keyboard`（掩码数值）的行为测试。
 *
 * ⚠️ **没有 Oracle**：虽然 `Selector/util.js` 与 `Input.js:219-229` 的**算式**是纯的，
 * 但它们所在的模块 `Input.js` 绑 React，无法单独抽出对拍（契约 §3.5 / §4.1）。
 * 这里的断言来自读源码，并**显式钉住两条容易被「顺手修正」的行为**。
 */

import { describe, expect, it } from 'vitest';

import { getMaskRange, offsetCellValue } from '../keyboard';

describe('getMaskRange（Selector/util.js 的 PresetRange）', () => {
  it('六个字段的区间与上游一致', () => {
    expect(getMaskRange('MM')).toEqual([1, 12]);
    expect(getMaskRange('DD')).toEqual([1, 31]);
    expect(getMaskRange('HH')).toEqual([0, 23]);
    expect(getMaskRange('mm')).toEqual([0, 59]);
    expect(getMaskRange('ss')).toEqual([0, 59]);
    expect(getMaskRange('SSS')).toEqual([0, 999]);
  });

  it('YYYY 的第三项是**当前年份**（每次调用现算）', () => {
    const range = getMaskRange('YYYY');
    expect(range?.[0]).toBe(0);
    expect(range?.[1]).toBe(9999);
    expect(range?.[2]).toBe(new Date().getFullYear());
  });

  it('未知字段 ⇒ undefined（调用方应忽略这次按键）', () => {
    expect(getMaskRange('XX')).toBeUndefined();
    expect(getMaskRange('')).toBeUndefined();
  });
});

describe('offsetCellValue（Input.js:219-229）', () => {
  it('正常数字：上下各 ±1 并取模环绕', () => {
    // MM：1..12，size = 12
    expect(offsetCellValue('5', 'MM', 1)).toBe('6');
    expect(offsetCellValue('5', 'MM', -1)).toBe('4');
    expect(offsetCellValue('12', 'MM', 1)).toBe('1');
    expect(offsetCellValue('1', 'MM', -1)).toBe('12');
  });

  it('⭐ 空文本走「按 0 起算」那条（Number("") === 0，不是 NaN）', () => {
    // offset = +1 ⇒ 0 + 1 = 1
    expect(offsetCellValue('', 'MM', 1)).toBe('1');
    // offset = -1 ⇒ (12 + (-1) - 1) % 12 = 10 ⇒ 1 + 10 = 11
    expect(offsetCellValue('', 'MM', -1)).toBe('11');
  });

  it('非数字文本：有 default 时给 default', () => {
    const year = String(new Date().getFullYear());
    expect(offsetCellValue('abcd', 'YYYY', 1)).toBe(year);
    expect(offsetCellValue('abcd', 'YYYY', -1)).toBe(year);
  });

  it('非数字文本且无 default：offset > 0 给下界，否则给上界', () => {
    expect(offsetCellValue('abcd', 'MM', 1)).toBe('1');
    expect(offsetCellValue('abcd', 'MM', -1)).toBe('12');
    expect(offsetCellValue('abcd', 'HH', -1)).toBe('23');
  });

  it('未知字段 ⇒ undefined', () => {
    expect(offsetCellValue('5', 'XX', 1)).toBeUndefined();
  });

  it('⭐ 只取一次模 —— 不补 `(x % size + size) % size`', () => {
    // 上游对极端负值给出越界结果；补了「安全取模」就会与 antd 分叉。
    // MM：-20 ⇒ (12 + (-20) - 1) % 12 = (-9) % 12 = -9 ⇒ 1 + (-9) = -8
    expect(offsetCellValue('-19', 'MM', -1)).toBe('-8');
  });

  it('小时跨 0/23 边界', () => {
    expect(offsetCellValue('23', 'HH', 1)).toBe('0');
    expect(offsetCellValue('0', 'HH', -1)).toBe('23');
  });
});
