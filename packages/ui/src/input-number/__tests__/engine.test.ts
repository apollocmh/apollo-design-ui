/**
 * 引擎单测 —— Decimal（mini-decimal 行为对拍）+ numberUtil + getDecupleSteps。
 *
 * 判据来自 `@rc-component/mini-decimal@1.1.4` / rc-input-number@1.6.2 的
 * 行为规格（docs/analysis/input-number.md §2），不是快照移植。
 */
import { describe, expect, it } from 'vitest';
import { getMiniDecimal, toFixedDecimal } from '../engine/decimal';
import {
  getDecupleSteps,
  getNumberPrecision,
  num2str,
  trimNumber,
  validateNumber,
} from '../engine/number-util';

describe('engine · validateNumber / trimNumber', () => {
  it('三种书写形态', () => {
    expect(validateNumber('11.28')).toBe(true);
    expect(validateNumber('1.')).toBe(true);
    expect(validateNumber('.1')).toBe(true);
    expect(validateNumber('-3.5')).toBe(true);
    expect(validateNumber('abc')).toBe(false);
    expect(validateNumber('')).toBe(false);
    expect(validateNumber(NaN)).toBe(false);
    expect(validateNumber(1.5)).toBe(true);
  });

  it('trimNumber 规范化', () => {
    expect(trimNumber('1.100').fullStr).toBe('1.1');
    expect(trimNumber('0001').fullStr).toBe('1');
    expect(trimNumber('000.1').fullStr).toBe('0.1');
    expect(trimNumber('-0').fullStr).toBe('0');
    expect(trimNumber('  2.50 ').fullStr).toBe('2.5');
  });

  it('getNumberPrecision', () => {
    expect(getNumberPrecision('1.23')).toBe(2);
    expect(getNumberPrecision('1')).toBe(0);
    expect(getNumberPrecision(1e-9)).toBe(9);
  });

  it('num2str 科学计数法展开', () => {
    expect(num2str(1e-9)).toBe('0.000000001');
    expect(num2str(11.28)).toBe('11.28');
  });
});

describe('engine · Decimal', () => {
  it('add 无浮点误差（BigIntDecimal 路径）', () => {
    expect(getMiniDecimal(0.1).add(0.2).toString()).toBe('0.3');
    expect(getMiniDecimal('0.1').add('0.2').toString()).toBe('0.3');
  });

  it('add / negate / lessEquals / equals', () => {
    const a = getMiniDecimal('1.5');
    expect(a.add('2.25').toString()).toBe('3.75');
    expect(a.negate().toString()).toBe('-1.5');
    expect(getMiniDecimal('1').lessEquals(getMiniDecimal('1'))).toBe(true);
    expect(getMiniDecimal('0.5').lessEquals(getMiniDecimal('1'))).toBe(true);
    expect(getMiniDecimal('2').lessEquals(getMiniDecimal('1'))).toBe(false);
    expect(getMiniDecimal('1.0').equals(getMiniDecimal('1'))).toBe(true);
  });

  it('空值 / NaN', () => {
    expect(getMiniDecimal('').isEmpty()).toBe(true);
    expect(getMiniDecimal('').isInvalidate()).toBe(true);
    expect(getMiniDecimal('abc').isNaN()).toBe(true);
    expect(getMiniDecimal('-').isNaN()).toBe(true);
    expect(getMiniDecimal('').toString()).toBe('');
  });

  it('toString(safe=false) 保留原串', () => {
    expect(getMiniDecimal('1.100').toString(false)).toBe('1.100');
    expect(getMiniDecimal('1.100').toString()).toBe('1.1');
  });

  it('超大数不丢精度', () => {
    expect(getMiniDecimal('9007199254740993').toString()).toBe('9007199254740993');
    expect(getMiniDecimal('9007199254740993').add('1').toString()).toBe('9007199254740994');
  });
});

describe('engine · toFixed', () => {
  it('四舍五入（过半进位）', () => {
    expect(toFixedDecimal('1.45', 1)).toBe('1.5');
    expect(toFixedDecimal('1.44', 1)).toBe('1.4');
    expect(toFixedDecimal('-1.45', 1)).toBe('-1.5');
  });

  it('截断位（cutOnly）不进位', () => {
    expect(toFixedDecimal('4', 0, '.', true)).toBe('4');
    expect(toFixedDecimal('3.8', 0, '.', true)).toBe('3');
    expect(toFixedDecimal('3.86', 1, '.', true)).toBe('3.8');
  });

  it('precision=0 去小数；padEnd 补零', () => {
    expect(toFixedDecimal('5', 0)).toBe('5');
    expect(toFixedDecimal('1.2', 4)).toBe('1.2000');
  });
});

describe('engine · getDecupleSteps（shift ×10）', () => {
  it('整数 / 小数 / 字符串', () => {
    expect(getDecupleSteps(1)).toBe('10');
    expect(getDecupleSteps(0.1)).toBe('1');
    expect(getDecupleSteps('0.01')).toBe('0.1');
    expect(getDecupleSteps('1.2')).toBe('12');
    expect(getDecupleSteps(3)).toBe('30');
  });
});
