import { describe, expect, it } from 'vitest';
import { findListDiffIndex } from '../index';

const getKey = (item: string): string => item;

describe('findListDiffIndex（algorithmUtil.js:39-80）', () => {
  it('两个空列表返回 null', () => {
    expect(findListDiffIndex<string>([], [], getKey)).toBeNull();
  });

  it('完全相同的列表返回 null', () => {
    expect(findListDiffIndex(['a', 'b', 'c'], ['a', 'b', 'c'], getKey)).toBeNull();
  });

  it('⭐ 长度**相等**时 multiple 恒为 true —— 等长也可能是「删一个再插一个」', () => {
    // `Math.abs(0) !== 1` ⇒ true。这是上游的保守判定，不是 bug：
    // 只看长度无法区分「替换一项」与「删一项 + 插一项」，所以按多处处理。
    expect(findListDiffIndex(['a', 'b', 'c'], ['a', 'X', 'c'], getKey)).toEqual({
      index: 1,
      multiple: true,
    });
  });

  it('⭐ 长度差 1 且下一项对齐 ⇒ multiple 为 false（典型的「插入一项」）', () => {
    expect(findListDiffIndex(['a', 'b', 'c'], ['a', 'X', 'b', 'c'], getKey)).toEqual({
      index: 1,
      multiple: false,
    });
  });

  it('⭐ 长度差 1 但下一项也对不上 ⇒ multiple 为 true', () => {
    // short = origin（3 < 4）；i=1 时 short[1]='b' vs long[1]='X' 差异；
    // 再看 short[1]='b' vs long[2]='Y' ⇒ 仍不同 ⇒ 多处
    expect(findListDiffIndex(['a', 'b', 'c'], ['a', 'X', 'Y', 'c'], getKey)).toEqual({
      index: 1,
      multiple: true,
    });
  });

  it('⭐ 长度差 > 1 ⇒ multiple 恒为 true（不用扫也知道是多处）', () => {
    expect(findListDiffIndex(['a', 'b'], ['a', 'b', 'c', 'd'], getKey)).toEqual({
      index: 2,
      multiple: true,
    });
  });

  it('⭐ 缺失位置用**同一个**哨兵 ⇒ 「两边都缺」不算差异', () => {
    // origin 2 项、target 1 项 ⇒ short = target、long = origin，multiple 初值 false
    // i=1：short[1] 缺（哨兵）vs long[1]='b' ⇒ 差异在 1
    // 再看 short[1]（哨兵）vs long[2]（也缺 ⇒ 同一个哨兵）⇒ 相同 ⇒ 仍是单处
    expect(findListDiffIndex(['a', 'b'], ['a'], getKey)).toEqual({ index: 1, multiple: false });
  });

  it('反向的删除（长 → 短）与插入对称', () => {
    expect(findListDiffIndex(['a', 'X', 'b', 'c'], ['a', 'b', 'c'], getKey)).toEqual({
      index: 1,
      multiple: false,
    });
  });

  it('目标为空、源非空 ⇒ 差异在第 0 位且多处', () => {
    expect(findListDiffIndex(['a', 'b'], [], getKey)).toEqual({ index: 0, multiple: true });
  });

  it('源为空、目标非空 ⇒ 差异在第 0 位且多处', () => {
    expect(findListDiffIndex([], ['a', 'b'], getKey)).toEqual({ index: 0, multiple: true });
  });

  it('只有一项且相同 ⇒ null', () => {
    expect(findListDiffIndex(['a'], ['a'], getKey)).toBeNull();
  });

  it('⭐ getKey 收到的永远是定义过的项（缺失位不会传进去）', () => {
    const seen: unknown[] = [];
    findListDiffIndex(['a', 'b'], ['a'], (item: string) => {
      seen.push(item);
      return item;
    });
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((item) => item !== undefined)).toBe(true);
  });

  it('差异总在第 0 位（首项就不同）', () => {
    expect(findListDiffIndex(['a', 'b'], ['X', 'b'], getKey)?.index).toBe(0);
  });
});
