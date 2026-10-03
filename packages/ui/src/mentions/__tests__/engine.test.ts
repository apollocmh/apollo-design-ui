/**
 * L1 · 引擎纯函数（`mentions/engine/util.ts`）—— **逐条**对拍 rc-mentions@1.12.0。
 *
 * 这些函数是整个引擎里唯一能在 jsdom 里被完整验证的部分（没有布局、没有时序）
 * ⇒ 边界由这里钉死；组件行为（`__tests__/index.test.ts`）只做接线。
 *
 * 每个函数都带一条**上游注释里的原例**（`replaceWithMeasure` 的 `little@litest`）
 * 或一条边界（`reduceText` 的「targetText 比 text 长」）。
 */

import { describe, expect, it } from 'vitest';
import {
  filterOption,
  getBeforeSelectionText,
  getLastMeasureIndex,
  replaceWithMeasure,
  setInputSelection,
  validateSearch,
} from '../engine/util';

describe('Mentions · engine/util · getBeforeSelectionText', () => {
  it('切到光标前（selectionStart 是切点，不含光标处字符）', () => {
    expect(getBeforeSelectionText({ value: 'hello', selectionStart: 2 })).toBe('he');
  });

  it('selectionStart=0 ⇒ 空串；= length ⇒ 全串', () => {
    expect(getBeforeSelectionText({ value: 'hello', selectionStart: 0 })).toBe('');
    expect(getBeforeSelectionText({ value: 'hello', selectionStart: 5 })).toBe('hello');
  });
});

describe('Mentions · engine/util · getLastMeasureIndex', () => {
  it('取**最靠右**的命中', () => {
    expect(getLastMeasureIndex('a@b#c@d', ['@'])).toEqual({ location: 5, prefix: '@' });
  });

  it('多前缀：谁的 lastIndexOf 更大谁赢', () => {
    expect(getLastMeasureIndex('a@b#c', ['@', '#'])).toEqual({ location: 3, prefix: '#' });
    expect(getLastMeasureIndex('a#b@c', ['@', '#'])).toEqual({ location: 3, prefix: '@' });
  });

  it('🚨 判据是**严格大于** ⇒ 位置相同的两个前缀，**先出现的赢**', () => {
    expect(getLastMeasureIndex('@x', ['@', '@'])).toEqual({ location: 0, prefix: '@' });
    // 'ab@' 上 '@' 与 'b@' 的 lastIndexOf 不同（2 vs 1）⇒ 仍是 '@'
    expect(getLastMeasureIndex('ab@', ['@', 'b@'])).toEqual({ location: 2, prefix: '@' });
  });

  it('未命中 ⇒ { location: -1, prefix: "" }', () => {
    expect(getLastMeasureIndex('hello', ['@'])).toEqual({ location: -1, prefix: '' });
  });
});

describe('Mentions · engine/util · replaceWithMeasure', () => {
  it('上游注释里的原例：little@litest + light ⇒ little @light test', () => {
    const result = replaceWithMeasure('little@litest', {
      measureLocation: 6,
      prefix: '@',
      targetText: 'light',
      selectionStart: 8,
      split: ' ',
    });
    expect(result.text).toBe('little @light test');
    expect(result.selectionLocation).toBe('little @light '.length);
  });

  it('前缀前已是 split ⇒ 不重复补（`@x` 在句首）', () => {
    const result = replaceWithMeasure('@a', {
      measureLocation: 0,
      prefix: '@',
      targetText: 'afc163',
      selectionStart: 2,
      split: ' ',
    });
    expect(result.text).toBe('@afc163 ');
  });

  it('前缀前有内容但无 split ⇒ 补一个（`hi@a`）', () => {
    const result = replaceWithMeasure('hi@a', {
      measureLocation: 2,
      prefix: '@',
      targetText: 'afc163',
      selectionStart: 4,
      split: ' ',
    });
    expect(result.text).toBe('hi @afc163 ');
  });

  it('前缀前已带 split ⇒ 削掉再补（等价于只留一个）', () => {
    const result = replaceWithMeasure('hi @a', {
      measureLocation: 3,
      prefix: '@',
      targetText: 'afc163',
      selectionStart: 5,
      split: ' ',
    });
    expect(result.text).toBe('hi @afc163 ');
  });

  it('大小写不敏感的去重（reduceText 的 lower 比较）', () => {
    // 'a@liGHtzzz'：光标在 5 ⇒ restText 从 'Htzzz' 起，targetText 的对应后缀是 'ht'
    // ⇒ 大小写不敏感地削掉 'Ht' ⇒ 剩 'zzz'
    const result = replaceWithMeasure('a@liGHtzzz', {
      measureLocation: 1,
      prefix: '@',
      targetText: 'light',
      selectionStart: 5,
      split: ' ',
    });
    expect(result.text).toBe('a @light zzz');
  });

  it('首个字符不同 ⇒ 从 0 切开（restText 原样保留）', () => {
    const result = replaceWithMeasure('a@liTest', {
      measureLocation: 1,
      prefix: '@',
      targetText: 'light',
      selectionStart: 5,
      split: ' ',
    });
    // targetText.slice(5-1-1=3) = 'ht'；text.slice(5) = 'est' ⇒ 'e' vs 'h' 分叉 ⇒ 保留 'est'
    expect(result.text).toBe('a @light est');
  });
});

describe('Mentions · engine/util · setInputSelection', () => {
  it('先 setSelectionRange，**再 blur + focus**（顺序是契约）', () => {
    const calls: string[] = [];
    setInputSelection(
      {
        setSelectionRange: (start: number, end: number) => calls.push(`range:${start}-${end}`),
        blur: () => calls.push('blur'),
        focus: () => calls.push('focus'),
      },
      4,
    );
    expect(calls).toEqual(['range:4-4', 'blur', 'focus']);
  });
});

describe('Mentions · engine/util · validateSearch / filterOption', () => {
  it('validateSearch：不含 split 即合法；split 为空串时恒合法', () => {
    expect(validateSearch('abc', ' ')).toBe(true);
    expect(validateSearch('a b', ' ')).toBe(false);
    expect(validateSearch('a b', '')).toBe(true);
  });

  it('filterOption：option.value **包含**输入串（大小写不敏感）；空串恒命中', () => {
    expect(filterOption('afc', { value: 'afc163' })).toBe(true);
    expect(filterOption('AFC', { value: 'afc163' })).toBe(true);
    expect(filterOption('zzz', { value: 'afc163' })).toBe(false);
    expect(filterOption('', { value: 'anything' })).toBe(true);
  });

  it('filterOption：value 缺省时按空串比（`"".includes(input)`）', () => {
    expect(filterOption('', {})).toBe(true);
    expect(filterOption('a', {})).toBe(false);
  });
});
