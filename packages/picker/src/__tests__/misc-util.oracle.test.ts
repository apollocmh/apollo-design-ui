/**
 * `misc-util` 对 `@rc-component/picker@1.12.2` 的 `es/utils/miscUtil.js` 差分。
 *
 * 上游该文件 **零 import** ⇒ 可对拍。
 *
 * ⚠️ `getRowFormat` 只比对 `PickerMode` 能取到的值：上游的 `case 'datetime'` 走的是
 * `InternalMode`，本包按 `PickerMode` 收窄（契约 §5.4），那条分支**不在**本包语义里。
 */

import { describe, expect, it } from 'vitest';

import * as up from '../../oracle/upstream/miscUtil.js';
import { fillIndex, getFromDate, getRowFormat, leftPad, pickProps, toArray } from '../misc-util';
import type { PickerLocale, PickerMode } from '../types';

describe('misc-util · Oracle 差分（@rc-component/picker@1.12.2）', () => {
  it('leftPad 逐位一致（含超过 length 不截断的那条）', () => {
    const inputs: [string | number, number][] = [
      ['1', 2],
      ['12', 2],
      ['123', 2],
      [7, 4],
      [0, 3],
      ['', 2],
    ];
    for (const [str, length] of inputs) {
      expect(leftPad(str, length)).toBe(up.leftPad(str, length));
      expect(leftPad(str, length)).toBe(up.leftPad(str, length));
    }
    // 自定义 fill
    expect(leftPad('9', 3, 'x')).toBe(up.leftPad('9', 3, 'x'));
  });

  it('toArray 逐位一致（null / undefined / 数组 / 单值）', () => {
    expect(toArray(null)).toEqual(up.toArray(null));
    expect(toArray(undefined)).toEqual(up.toArray(undefined));
    expect(toArray([1, 2, 3])).toEqual(up.toArray([1, 2, 3]));
    expect(toArray([])).toEqual(up.toArray([]));
    expect(toArray('a')).toEqual(up.toArray('a'));
    expect(toArray(0)).toEqual(up.toArray(0));
  });

  it('fillIndex 逐位一致（含越界写入）', () => {
    expect(fillIndex([1, 2, 3], 1, 9)).toEqual(up.fillIndex([1, 2, 3], 1, 9));
    expect(fillIndex([1, 2, 3], 0, 0)).toEqual(up.fillIndex([1, 2, 3], 0, 0));
    expect(fillIndex([1, 2, 3], 5, 7)).toEqual(up.fillIndex([1, 2, 3], 5, 7));
    // 不改动原数组
    const ori = [1, 2, 3];
    fillIndex(ori, 0, 9);
    expect(ori).toEqual([1, 2, 3]);
  });

  it('pickProps 逐位一致（keys 省略 / 指定 / 过滤 undefined）', () => {
    const props = { a: 1, b: undefined, c: 3, d: null };
    expect(pickProps(props)).toEqual(up.pickProps(props));
    expect(pickProps(props, ['a', 'b'])).toEqual(up.pickProps(props, ['a', 'b']));
    expect(pickProps(props, ['a', 'c'])).toEqual(up.pickProps(props, ['a', 'c']));
    expect(pickProps(props, [])).toEqual(up.pickProps(props, []));

    // ⭐ 用**键集合**而不是 toEqual：`toEqual` 会忽略 `b: undefined`，
    //    于是「忘了过滤 undefined」这个变异会存活（变异验证实测）。
    expect(Object.keys(pickProps(props))).toEqual(['a', 'c', 'd']);
    expect(Object.keys(up.pickProps(props))).toEqual(['a', 'c', 'd']);
    // `null` 不是空值，必须保留
    expect(pickProps(props).d).toBeNull();
  });

  it('getRowFormat 逐位一致（format 优先 + 六种 picker）', () => {
    const locale: PickerLocale = {
      locale: 'zh_CN',
      fieldDateFormat: 'D',
      fieldTimeFormat: 'T',
      fieldMonthFormat: 'M',
      fieldYearFormat: 'Y',
      fieldWeekFormat: 'W',
      fieldQuarterFormat: 'Q',
      fieldDateTimeFormat: 'DT',
    };
    const pickers: PickerMode[] = ['date', 'time', 'month', 'year', 'quarter', 'week'];
    for (const picker of pickers) {
      expect(getRowFormat(picker, locale)).toBe(up.getRowFormat(picker, locale));
      // `format` 优先
      expect(getRowFormat(picker, locale, 'X')).toBe(up.getRowFormat(picker, locale, 'X'));
    }
  });

  it('getRowFormat 在 locale 缺键时两侧同为 undefined', () => {
    const empty: PickerLocale = { locale: 'zh_CN' };
    for (const picker of ['time', 'month', 'year', 'quarter', 'week', 'date'] as PickerMode[]) {
      expect(getRowFormat(picker, empty)).toBe(up.getRowFormat(picker, empty));
      expect(getRowFormat(picker, empty)).toBeUndefined();
    }
  });

  it('getFromDate 逐位一致（含 activeIndex 命中与 triggeredFields 全空）', () => {
    const values = [null, 'B', 'C'];
    expect(getFromDate(values, [0, 1, 2], 0)).toBe(up.getFromDate(values, [0, 1, 2], 0));
    expect(getFromDate(values, [0, 1, 2], 1)).toBe(up.getFromDate(values, [0, 1, 2], 1));
    expect(getFromDate(values, [], 0)).toBe(up.getFromDate(values, [], 0));
    expect(getFromDate([], [0], 0)).toBe(up.getFromDate([], [0], 0));
    // activeIndex 恰好是第一个有值的 ⇒ undefined
    expect(getFromDate(['A', 'B'], [0, 1], 0)).toBeUndefined();
    expect(up.getFromDate(['A', 'B'], [0, 1], 0)).toBeUndefined();
  });
});
