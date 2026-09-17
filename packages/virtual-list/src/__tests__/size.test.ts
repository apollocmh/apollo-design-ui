import { describe, expect, it } from 'vitest';
import type { HeightsLookup } from '../index';
import { createSizeGetter } from '../index';

const DATA = ['a', 'b', 'c', 'd'];
const getKey = (item: string): string => item;

function makeGetter(
  heights: HeightsLookup = { get: () => undefined },
  data: readonly string[] = DATA,
) {
  return createSizeGetter<string>({ data, getKey, heights, itemHeight: 20 });
}

describe('createSizeGetter（useGetSize.js）', () => {
  it('单项查询：top 是该项的顶、bottom 是该项的底', () => {
    const getSize = makeGetter();
    // 全部未测量 ⇒ 一律 20
    expect(getSize('a')).toEqual({ top: 0, bottom: 20 });
    expect(getSize('b')).toEqual({ top: 20, bottom: 40 });
    expect(getSize('c')).toEqual({ top: 40, bottom: 60 });
  });

  it('区间查询：top 是第一项的顶、bottom 是最后一项的底', () => {
    const getSize = makeGetter();
    expect(getSize('b', 'd')).toEqual({ top: 20, bottom: 80 });
  });

  it('已测量高度参与累加，未测量的用 itemHeight 兜底', () => {
    const heights: HeightsLookup = { get: (key) => (key === 'b' ? 50 : undefined) };
    const getSize = makeGetter(heights);
    expect(getSize('a')).toEqual({ top: 0, bottom: 20 });
    expect(getSize('b')).toEqual({ top: 20, bottom: 70 });
    expect(getSize('c')).toEqual({ top: 70, bottom: 90 });
  });

  it('⭐ 第一项的 top 是 0（`bottomList[-1] || 0`）', () => {
    expect(makeGetter()('a').top).toBe(0);
  });

  it('⭐ 增量填充：已经算过的部分不重算（换一次查询仍得到同样结果）', () => {
    const getSize = makeGetter();
    expect(getSize('a')).toEqual({ top: 0, bottom: 20 });
    expect(getSize('d')).toEqual({ top: 60, bottom: 80 });
    expect(getSize('b')).toEqual({ top: 20, bottom: 40 });
  });

  it('⭐ 同一个 getter 实例上的结果稳定', () => {
    const getSize = makeGetter();
    const first = getSize('c');
    const second = getSize('c');
    expect(second).toEqual(first);
  });

  it('⭐ 与上游的有意差异：key 不在 data 里时返回 0 而不是 undefined', () => {
    // 上游的 .d.ts 声明 bottom 是 number，运行时却可能给 undefined —— 我们让声明是真的
    expect(makeGetter()('zzz')).toEqual({ top: 0, bottom: 0 });
  });

  it('空数据', () => {
    expect(makeGetter(undefined, [])('a')).toEqual({ top: 0, bottom: 0 });
  });

  it('⭐ 数据变长后继续增量填充（同一个实例）', () => {
    const data = ['a', 'b'];
    const getSize = createSizeGetter<string>({
      data,
      getKey,
      heights: { get: () => undefined },
      itemHeight: 10,
    });
    expect(getSize('b')).toEqual({ top: 10, bottom: 20 });

    data.push('c');
    expect(getSize('c')).toEqual({ top: 20, bottom: 30 });
  });

  it('⭐ 已缓存的键仍然可查（key2Index 命中）', () => {
    const getSize = makeGetter();
    getSize('a', 'd'); // 一次填满
    expect(getSize('c')).toEqual({ top: 40, bottom: 60 });
  });
});

describe('createSizeGetter · 稀疏数组', () => {
  it('⭐ 洞会被跳过（不写 key2Index、bottomList 该位留空）', () => {
    // 必须用 new Array 造洞 —— 从字面量数组改 length 是补不出洞的
    const sparse = new Array<string>(3);
    sparse[0] = 'a';
    sparse[2] = 'c';
    expect(1 in sparse).toBe(false);
    expect(sparse[1]).toBeUndefined();

    const getSize = createSizeGetter<string>({
      data: sparse,
      getKey: (item) => item,
      heights: { get: () => undefined },
      itemHeight: 10,
    });
    // a 的 bottom 是 10；c 在 index 2，累计 = 10 + (洞跳过 ⇒ 没有值) + 10
    expect(getSize('a')).toEqual({ top: 0, bottom: 10 });
    expect(getSize('c').bottom).toBeGreaterThan(0);
  });
});
