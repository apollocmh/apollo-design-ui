import { describe, expect, it } from 'vitest';
import type { ComputeScrollTargetInput, GetSize } from '../index';
import {
  computeScrollTarget,
  MAX_SCROLL_TO_TIMES,
  normalizeScrollArg,
  resolveScrollOffset,
} from '../index';

const getSize: GetSize = () => ({ top: 0, bottom: 0 });
const getKey = (item: string): string => item;

describe('resolveScrollOffset（useScrollTo.js:4-7）', () => {
  it('数字原样返回', () => {
    expect(resolveScrollOffset(12, { getSize })).toBe(12);
    expect(resolveScrollOffset(0, { getSize })).toBe(0);
    expect(resolveScrollOffset(-5, { getSize })).toBe(-5);
  });

  it('函数拿 info 求值', () => {
    const seen: unknown[] = [];
    const value = resolveScrollOffset(
      (info) => {
        seen.push(info.align);
        return 42;
      },
      { getSize, align: 'top' },
    );
    expect(value).toBe(42);
    expect(seen).toEqual(['top']);
  });

  it('⭐ 非有限数一律归 0 —— undefined / NaN / Infinity 都是同一件事', () => {
    expect(resolveScrollOffset(undefined, { getSize })).toBe(0);
    expect(resolveScrollOffset(Number.NaN, { getSize })).toBe(0);
    expect(resolveScrollOffset(Number.POSITIVE_INFINITY, { getSize })).toBe(0);
    expect(resolveScrollOffset(Number.NEGATIVE_INFINITY, { getSize })).toBe(0);
    expect(resolveScrollOffset(() => Number.NaN, { getSize })).toBe(0);
  });
});

function makeInput(
  overrides: Partial<ComputeScrollTargetInput<string>> = {},
): ComputeScrollTargetInput<string> {
  const data = Array.from({ length: 10 }, (_, i) => `item-${i}`);
  return {
    data,
    getKey,
    // 全部未测量 ⇒ 一律用 itemHeight
    heights: { get: () => undefined },
    itemHeight: 20,
    index: 3,
    align: 'top',
    offset: 0,
    containerHeight: 100,
    scrollTop: 0,
    ...overrides,
  };
}

describe('computeScrollTarget（useScrollTo.js:13-113）', () => {
  it('⭐ index < 0（按 key 没找到）⇒ 不滚，但要再收集一次', () => {
    const result = computeScrollTarget(makeInput({ index: -1 }));
    expect(result.targetTop).toBeNull();
    expect(result.needCollectHeight).toBe(true);
  });

  it("align = 'top' ⇒ 目标项的顶对齐容器顶", () => {
    // 第 3 项顶 = 3 × 20 = 60
    expect(computeScrollTarget(makeInput({ align: 'top' })).targetTop).toBe(60);
  });

  it("align = 'top' + offset ⇒ 顶对齐后再往上留 offset", () => {
    expect(computeScrollTarget(makeInput({ align: 'top', offset: 10 })).targetTop).toBe(50);
  });

  it("align = 'bottom' ⇒ 目标项的底对齐容器底", () => {
    // 第 3 项底 = 80；80 - 100 + 0 = -20
    expect(computeScrollTarget(makeInput({ align: 'bottom' })).targetTop).toBe(-20);
  });

  it("align = 'bottom' + offset", () => {
    expect(computeScrollTarget(makeInput({ align: 'bottom', offset: 30 })).targetTop).toBe(10);
  });

  it('⭐ align 缺省 + 目标在视口上方 ⇒ 本轮不滚，只决定下一轮用 top', () => {
    const result = computeScrollTarget(
      makeInput({ align: undefined, index: 3, scrollTop: 100, containerHeight: 100 }),
    );
    // 第 3 项顶 60 < scrollTop 100
    expect(result.targetTop).toBeNull();
    expect(result.nextAlign).toBe('top');
  });

  it('⭐ align 缺省 + 目标在视口下方 ⇒ 下一轮用 bottom', () => {
    const result = computeScrollTarget(
      makeInput({ align: undefined, index: 8, scrollTop: 0, containerHeight: 100 }),
    );
    // 第 8 项底 = 180 > 0 + 100
    expect(result.targetTop).toBeNull();
    expect(result.nextAlign).toBe('bottom');
  });

  it('⭐ align 缺省 + 目标已在视口内 ⇒ 什么都不改', () => {
    const result = computeScrollTarget(
      makeInput({ align: undefined, index: 3, scrollTop: 40, containerHeight: 100 }),
    );
    expect(result.targetTop).toBeNull();
    expect(result.nextAlign).toBeUndefined();
  });

  it('⭐ 可见范围内有未测量的项 ⇒ needCollectHeight 为 true', () => {
    const result = computeScrollTarget(
      makeInput({
        align: 'top',
        offset: 0,
        heights: { get: (key) => (key === 'item-1' ? 20 : undefined) },
      }),
    );
    // 反查从 maxLen=3 往 0 走：item-3 未测 ⇒ 立刻命中
    expect(result.needCollectHeight).toBe(true);
  });

  it('⭐ 可见范围内全部已测量 + 位置已稳定 ⇒ 不需要再收集', () => {
    const result = computeScrollTarget(
      makeInput({
        align: 'top',
        offset: 0,
        heights: { get: () => 20 },
        // 首轮的 lastTop 是 undefined ⇒ 一定 `targetTop !== undefined` ⇒ 必然再迭代一次。
        // 这里给一个已经稳定的值，才能观察到 false。
        lastTop: 60,
      }),
    );
    // leftHeight = 0（offset=0）⇒ 第一次循环就 `leftHeight <= 0` 退出，不判未测量
    expect(result.needCollectHeight).toBe(false);
  });

  it('⭐ 首轮（lastTop 未给）**必然**再迭代一次 —— 位置稳定需要两轮', () => {
    const first = computeScrollTarget(makeInput({ align: 'top', heights: { get: () => 20 } }));
    expect(first.targetTop).toBe(60);
    expect(first.needCollectHeight).toBe(true);

    const second = computeScrollTarget(
      makeInput({ align: 'top', heights: { get: () => 20 }, lastTop: first.targetTop }),
    );
    expect(second.needCollectHeight).toBe(false);
  });

  it('⭐ 位置还没稳定（targetTop !== lastTop）⇒ 需要再收集', () => {
    const measured = { get: () => 20 };
    expect(
      computeScrollTarget(makeInput({ align: 'top', heights: measured, lastTop: 999 }))
        .needCollectHeight,
    ).toBe(true);
    expect(
      computeScrollTarget(makeInput({ align: 'top', heights: measured, lastTop: 60 }))
        .needCollectHeight,
    ).toBe(false);
  });

  it('⭐ containerHeight 为 0 ⇒ 整个计算块跳过', () => {
    const result = computeScrollTarget(makeInput({ containerHeight: 0 }));
    expect(result.targetTop).toBeNull();
    expect(result.nextAlign).toBe('top');
    expect(result.needCollectHeight).toBe(false);
  });

  it('已测量高度会改变累加结果', () => {
    // 第 0..2 项各 50，其余 20 ⇒ 第 3 项顶 = 150
    const result = computeScrollTarget(
      makeInput({
        align: 'top',
        heights: { get: (key) => (Number(String(key).split('-')[1]) < 3 ? 50 : undefined) },
      }),
    );
    expect(result.targetTop).toBe(150);
  });

  it('index 超过数据长度时被夹到末项', () => {
    const result = computeScrollTarget(makeInput({ align: 'top', index: 999 }));
    // maxLen = min(9, 999) = 9 ⇒ 第 9 项顶 = 180
    expect(result.targetTop).toBe(180);
  });

  it('迭代上限是 10（上游 MAX_TIMES）', () => {
    expect(MAX_SCROLL_TO_TIMES).toBe(10);
  });
});

describe('normalizeScrollArg（useScrollTo.js:125-151）', () => {
  const data = ['a', 'b', 'c'];

  /** 收窄到 item 形态后取 index（联合类型上不能直接访问）。 */
  function itemIndex(arg: Parameters<typeof normalizeScrollArg>[0]): number {
    const normalized = normalizeScrollArg(arg, data, getKey);
    if (normalized.kind !== 'item') throw new Error('应当是 item 形态');
    return normalized.index;
  }

  it('null / undefined ⇒ flash', () => {
    expect(normalizeScrollArg(null, data, getKey).kind).toBe('flash');
    expect(normalizeScrollArg(undefined, data, getKey).kind).toBe('flash');
  });

  it('数字 ⇒ top', () => {
    expect(normalizeScrollArg(120, data, getKey)).toEqual({ kind: 'top', top: 120 });
  });

  it('{ index } ⇒ item，且保留 align / offset', () => {
    expect(normalizeScrollArg({ index: 2, align: 'bottom', offset: 5 }, data, getKey)).toEqual({
      kind: 'item',
      index: 2,
      align: 'bottom',
      offset: 5,
    });
  });

  it('⭐ { key } ⇒ 现查下标', () => {
    expect(normalizeScrollArg({ key: 'b' }, data, getKey)).toEqual({
      kind: 'item',
      key: 'b',
      index: 1,
      align: undefined,
      offset: undefined,
    });
  });

  it('⭐ key 找不到 ⇒ index 为 -1（调用方据此触发重试）', () => {
    expect(itemIndex({ key: 'zzz' })).toBe(-1);
  });

  it('index 优先于 key', () => {
    expect(itemIndex({ index: 2, key: 'a' })).toBe(2);
  });

  it('index 为 0 也算给了（不能被当成 falsy 漏掉）', () => {
    expect(itemIndex({ index: 0 })).toBe(0);
  });
});
