/**
 * 批次② 的直接调用测试。
 *
 * 与 `batch2.oracle.test.ts` 的分工：
 * - oracle 管「与 rc-form 一致」（能对拍的都拍了）；
 * - 本文件管 **oracle 到不了的部分** —— 主要是 `replaceMessage`
 *   （它在 `validateUtil.js` 里，那个文件 `import * as React from 'react'`
 *   且该函数未导出 ⇒ 无法对拍），以及一些分支覆盖。
 *
 * ⚠️ 期望值来自读源码（`validateUtil.js:13-21`），不是照我们的实现反推。
 */

import { describe, expect, it } from 'vitest';

import { NameMap } from '../name-map';
import { defaultValidateMessages, replaceMessage } from '../validate-messages';
import { toArray as toNamePathArray } from '../value-util';

// ---------------------------------------------------------------------------
// toArray（namePath 版）
// ---------------------------------------------------------------------------

describe('toArray（namePath 版）', () => {
  it('undefined / null ⇒ 空数组', () => {
    expect(toNamePathArray(undefined)).toEqual([]);
    expect(toNamePathArray(null as never)).toEqual([]);
  });

  it('⭐ 数组原样返回（不拷贝）', () => {
    const arr = ['a', 'b'];
    expect(toNamePathArray(arr)).toBe(arr);
  });

  it("⭐ `0` 与 `''` 都会包成数组（它们是合法的键）", () => {
    expect(toNamePathArray(0)).toEqual([0]);
    expect(toNamePathArray('')).toEqual(['']);
  });

  it('单个字符串 / 数字', () => {
    expect(toNamePathArray('a')).toEqual(['a']);
    expect(toNamePathArray(1)).toEqual([1]);
  });

  it('⚠️ 与 utils 的 `toArray` 同名不同义 —— 那个是给 Vue children 用的', () => {
    // utils 的 toArray 返回 VNode[]，这里返回 (string|number)[]
    // 这条断言的意义是「提醒别把两者搞混」，不是验证行为
    expect(Array.isArray(toNamePathArray('a'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// replaceMessage（validateUtil.js:13-21）
// ---------------------------------------------------------------------------

describe('replaceMessage', () => {
  it('单个占位符', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
    expect(replaceMessage("I'm ${name}", { name: 'bamboo' })).toBe("I'm bamboo");
  });

  it('多个占位符（含重复）', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
    expect(replaceMessage('${a} + ${b} = ${a}', { a: 1, b: 2 })).toBe('1 + 2 = 1');
  });

  // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
  it('⭐ `\\${name}` ⇒ 去掉反斜杠、**原样输出**（不替换）', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
    expect(replaceMessage('\\${name}', { name: 'x' })).toBe('${name}');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
    expect(replaceMessage('a \\${n} b', { n: 'x' })).toBe('a ${n} b');
  });

  it('⭐ 未知的键 ⇒ 字符串 `undefined`（上游行为，不是抛错）', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
    expect(replaceMessage('${nope}', {})).toBe('undefined');
  });

  it('没有占位符 ⇒ 原样返回', () => {
    expect(replaceMessage('plain text', { a: 1 })).toBe('plain text');
  });

  it('⭐ 占位符名必须是 `\\w+` —— 带横线/点的不会被匹配', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
    expect(replaceMessage('${a-b}', { 'a-b': 'x' })).toBe('${a-b}');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
    expect(replaceMessage('${a.b}', { 'a.b': 'x' })).toBe('${a.b}');
  });

  it('数字键也能替换（`\\w` 含数字）', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
    expect(replaceMessage('${0}', { 0: 'zero' })).toBe('zero');
  });

  it('值可以是任意类型（会被 String 化）', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
    expect(replaceMessage('${v}', { v: [1, 2] })).toBe('1,2');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
    expect(replaceMessage('${v}', { v: null })).toBe('null');
  });

  it('⭐ 默认模板里的占位符都能被替换（与 defaultValidateMessages 配套）', () => {
    const kv = {
      name: 'user',
      type: 'string',
      enum: 'a, b',
      min: 1,
      max: 9,
      len: 3,
      pattern: '/x/',
    };
    expect(replaceMessage(defaultValidateMessages.required as string, kv)).toBe(
      "'user' is required",
    );
    expect(replaceMessage(defaultValidateMessages.enum as string, kv)).toBe(
      "'user' must be one of [a, b]",
    );
    expect(replaceMessage(defaultValidateMessages.string.min as string, kv)).toBe(
      "'user' must be at least 1 characters",
    );
    expect(replaceMessage(defaultValidateMessages.string.range as string, kv)).toBe(
      "'user' must be between 1 and 9 characters",
    );
    expect(replaceMessage(defaultValidateMessages.pattern.mismatch as string, kv)).toBe(
      "'user' does not match pattern /x/",
    );
    expect(replaceMessage(defaultValidateMessages.default as string, kv)).toBe(
      "Validation error on field 'user'",
    );
    expect(replaceMessage(defaultValidateMessages.types.string as string, kv)).toBe(
      "'user' is not a valid string",
    );
  });
});

// ---------------------------------------------------------------------------
// defaultValidateMessages 的结构
// ---------------------------------------------------------------------------

describe('defaultValidateMessages 的结构', () => {
  // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
  it('⭐ 两套模板的差异：这套用 `${name}`，schema 那套用 `%s`', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: 占位符语法是有意字面量（replaceMessage 的契约输入）
    expect(defaultValidateMessages.required).toContain('${name}');
    expect(defaultValidateMessages.required).not.toContain('%s');
  });

  it('⭐ 文案自带单引号（会原样出现在界面上）', () => {
    expect(defaultValidateMessages.required?.startsWith("'")).toBe(true);
  });

  it('date 三个键 / pattern 一个键', () => {
    expect(Object.keys(defaultValidateMessages.date)).toEqual(['format', 'parse', 'invalid']);
    expect(Object.keys(defaultValidateMessages.pattern)).toEqual(['mismatch']);
  });

  it('types 覆盖 14 个类型', () => {
    expect(Object.keys(defaultValidateMessages.types)).toHaveLength(14);
  });

  it('string / number / array 各有 len/min/max/range', () => {
    for (const key of ['string', 'number', 'array'] as const) {
      expect(Object.keys(defaultValidateMessages[key])).toEqual(['len', 'min', 'max', 'range']);
    }
  });
});

// ---------------------------------------------------------------------------
// NameMap 的补充分支
// ---------------------------------------------------------------------------

describe('NameMap 补充', () => {
  it("⭐ `update` 用 `!next` 判定删除 ⇒ `0` / `''` 也会被删掉", () => {
    const map = new NameMap<number>();
    map.set(['a'], 1);
    map.update(['a'], () => 0);
    expect(map.get(['a'])).toBeUndefined();
  });

  it('`getAsPrefix` 的「自己也算」', () => {
    const map = new NameMap<string>();
    map.set(['a'], 'self');
    expect(map.getAsPrefix(['a'])).toEqual(['self']);
  });

  it("⭐ `getAsPrefix(['a'])` 不会匹配 `['ab']`（SPLIT 边界）", () => {
    const map = new NameMap<string>();
    map.set(['ab'], 'other');
    expect(map.getAsPrefix(['a'])).toEqual([]);
  });

  it('空 Map 的 getAsPrefix ⇒ []', () => {
    expect(new NameMap<number>().getAsPrefix(['a'])).toEqual([]);
  });

  it('toJSON 对空 Map ⇒ {}', () => {
    expect(new NameMap<number>().toJSON()).toEqual({});
  });

  it('map 的 key 是深拷贝出来的新数组（改它不影响 Map）', () => {
    const map = new NameMap<number>();
    map.set(['a'], 1);
    const keys = map.map(({ key: k }) => k);
    keys[0]?.push('b');
    // 反解出的数组是可改的（每次 map 都新建），但 Map 本身不受影响
    expect(keys[0]).toEqual(['a', 'b']);
    expect(map.get(['a'])).toBe(1);
    expect(map.get(['a', 'b'])).toBeUndefined();
  });
});
