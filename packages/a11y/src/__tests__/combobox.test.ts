import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TYPEAHEAD_RESET_DELAY,
  findTypeaheadIndex,
  getListboxId,
  getOptionId,
  INITIAL_TYPEAHEAD_STATE,
  NO_ACTIVE_INDEX,
  pushTypeaheadChar,
} from '../index';

describe('aria id 方案（rc-select OptionList.js:251,280）', () => {
  it('listbox 的 id 是 id 加 _list 后缀', () => {
    expect(getListboxId('test-id')).toBe('test-id_list');
  });

  it('选项的 id 是 listbox id 再加 _ 与下标', () => {
    expect(getOptionId('test-id', 0)).toBe('test-id_list_0');
    expect(getOptionId('test-id', 12)).toBe('test-id_list_12');
  });

  it('⭐ 与 antd 的 DOM 快照对得上（components.test.tsx.snap:23546）', () => {
    // 快照里：aria-controls="test-id_list"、aria-activedescendant="test-id_list_0"
    const id = 'test-id';
    expect(getListboxId(id)).toBe('test-id_list');
    expect(getOptionId(id, 0)).toBe('test-id_list_0');
  });
});

describe('pushTypeaheadChar', () => {
  it('没有超时时累积', () => {
    const s1 = pushTypeaheadChar(INITIAL_TYPEAHEAD_STATE, 'a', 1000);
    const s2 = pushTypeaheadChar(s1, 'b', 1100);
    expect(s2.buffer).toBe('ab');
    expect(s2.lastAt).toBe(1100);
  });

  it('⭐ 超过 resetDelay 时重新起头', () => {
    const s1 = pushTypeaheadChar(INITIAL_TYPEAHEAD_STATE, 'a', 1000);
    const s2 = pushTypeaheadChar(s1, 'b', 1000 + DEFAULT_TYPEAHEAD_RESET_DELAY + 1);
    expect(s2.buffer).toBe('b');
  });

  it('⭐ 刚好等于 resetDelay 不算超时（判定用 > 而不是 >=）', () => {
    const s1 = pushTypeaheadChar(INITIAL_TYPEAHEAD_STATE, 'a', 1000);
    const s2 = pushTypeaheadChar(s1, 'b', 1000 + DEFAULT_TYPEAHEAD_RESET_DELAY);
    expect(s2.buffer).toBe('ab');
  });

  it('连按同一个键会累积成重复串（循环语义由调用方配合 findTypeaheadIndex 实现）', () => {
    let state = INITIAL_TYPEAHEAD_STATE;
    for (const at of [0, 100, 200]) {
      state = pushTypeaheadChar(state, 'a', at);
    }
    expect(state.buffer).toBe('aaa');
  });

  it('返回新对象，不改入参（纯函数）', () => {
    const before = { buffer: 'a', lastAt: 10 };
    const after = pushTypeaheadChar(before, 'b', 20);
    expect(before).toEqual({ buffer: 'a', lastAt: 10 });
    expect(after).not.toBe(before);
  });

  it('可以自定义 resetDelay', () => {
    const s1 = pushTypeaheadChar(INITIAL_TYPEAHEAD_STATE, 'a', 0);
    const s2 = pushTypeaheadChar(s1, 'b', 100, 50);
    expect(s2.buffer).toBe('b');
  });
});

describe('findTypeaheadIndex', () => {
  const labels = ['Apple', 'Avocado', 'Banana', 'apricot'];

  it('从下一项开始找（跳过当前项）', () => {
    expect(findTypeaheadIndex(labels, 'a', NO_ACTIVE_INDEX)).toBe(0);
    expect(findTypeaheadIndex(labels, 'a', 0)).toBe(1);
  });

  it('大小写不敏感', () => {
    expect(findTypeaheadIndex(labels, 'AP', NO_ACTIVE_INDEX)).toBe(0);
  });

  it('⭐ 走到末尾会绕回开头', () => {
    expect(findTypeaheadIndex(labels, 'b', 3)).toBe(2);
  });

  it('⭐ 绕回后能一直找到当前项自身（全表一圈，共 count 次）', () => {
    // 只有 'Banana' 以 b 开头；从它自己开始也要能再次找到它
    expect(findTypeaheadIndex(labels, 'b', 2)).toBe(2);
  });

  it('没有命中返回 -1', () => {
    expect(findTypeaheadIndex(labels, 'z', NO_ACTIVE_INDEX)).toBe(-1);
  });

  it('空 buffer 直接返回 -1（不把第一项当成命中）', () => {
    expect(findTypeaheadIndex(labels, '', NO_ACTIVE_INDEX)).toBe(-1);
  });

  it('空列表返回 -1', () => {
    expect(findTypeaheadIndex([], 'a', NO_ACTIVE_INDEX)).toBe(-1);
  });

  it('⭐ fromIndex 小于 -1 也不会得到负数下标（双重取模）', () => {
    const index = findTypeaheadIndex(labels, 'a', -7);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(labels[index]).toBeDefined();
  });

  it('重复串能用于「在多个匹配项之间循环」', () => {
    const many = ['Ant', 'Ape', 'Asp'];
    // 第一次按 a：命中 Ant
    const first = findTypeaheadIndex(many, 'a', NO_ACTIVE_INDEX);
    // 再按一次 a ⇒ buffer 变 'aa'，没有 'aa' 开头的项 ⇒ -1
    // 于是调用方应保留 buffer 为 'a' 并继续从 first 往后找：
    const second = findTypeaheadIndex(many, 'a', first);
    const third = findTypeaheadIndex(many, 'a', second);
    expect([first, second, third]).toEqual([0, 1, 2]);
    // 再往后又回到 0 —— 循环闭合
    expect(findTypeaheadIndex(many, 'a', third)).toBe(0);
  });
});
