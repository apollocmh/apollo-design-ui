import { describe, expect, it } from 'vitest';
import type { ComputeRangeInput } from '../index';
import {
  computeRange,
  isInVirtual,
  keepInHorizontalRange,
  keepInRange,
  shouldUseVirtual,
  sumHeights,
} from '../index';

/** 造 100 项、每项 20、容器 100 的标准场景。 */
function makeInput(overrides: Partial<ComputeRangeInput<string>> = {}): ComputeRangeInput<string> {
  const data = Array.from({ length: 100 }, (_, i) => `item-${i}`);
  return {
    data,
    getKey: (item) => item,
    heights: { get: () => undefined },
    itemHeight: 20,
    height: 100,
    offsetTop: 0,
    useVirtual: true,
    inVirtual: true,
    measuredInnerHeight: 0,
    ...overrides,
  };
}

describe('shouldUseVirtual（List.js:62）', () => {
  it('三条件都成立才虚拟化', () => {
    expect(shouldUseVirtual(undefined, 100, 20)).toBe(true);
    expect(shouldUseVirtual(true, 100, 20)).toBe(true);
  });

  it('virtual === false 直接关掉', () => {
    expect(shouldUseVirtual(false, 100, 20)).toBe(false);
  });

  it('⭐ height 与 itemHeight 都必须是**真值**（0 不算）', () => {
    expect(shouldUseVirtual(undefined, 0, 20)).toBe(false);
    expect(shouldUseVirtual(undefined, 100, 0)).toBe(false);
    expect(shouldUseVirtual(undefined, undefined, 20)).toBe(false);
    expect(shouldUseVirtual(undefined, 100, undefined)).toBe(false);
  });
});

describe('isInVirtual（List.js:64）', () => {
  it('估算总高超过容器高 ⇒ 虚拟化', () => {
    expect(isInVirtual(true, 100, 20, 0, 100, undefined)).toBe(true);
  });

  it('数据太少撑不满容器 ⇒ 不虚拟化（全渲染）', () => {
    expect(isInVirtual(true, 3, 20, 0, 100, undefined)).toBe(false);
  });

  it('⭐ 用 max(估算总高, 已测量总高) —— 只看估算会误判', () => {
    // 只有 2 项（估算 40 < 100），但实测总高 300 > 100
    expect(isInVirtual(true, 2, 20, 300, 100, undefined)).toBe(true);
  });

  it('设了 scrollWidth 就强制虚拟化', () => {
    expect(isInVirtual(true, 1, 20, 0, 100, 500)).toBe(true);
  });

  it('useVirtual 为假或数据为空 ⇒ 不虚拟化', () => {
    expect(isInVirtual(false, 100, 20, 0, 100, 500)).toBe(false);
    expect(isInVirtual(true, 0, 20, 0, 100, 500)).toBe(false);
  });
});

describe('computeRange（List.js:120-181）', () => {
  it('useVirtual 为假 ⇒ 三项都是「不虚拟」的形态', () => {
    expect(computeRange(makeInput({ useVirtual: false }))).toEqual({
      scrollHeight: undefined,
      start: 0,
      end: 99,
      offset: undefined,
    });
  });

  it('⭐ inVirtual 为假 ⇒ scrollHeight 取实测内层高，仍全渲染', () => {
    expect(computeRange(makeInput({ inVirtual: false, measuredInnerHeight: 77 }))).toEqual({
      scrollHeight: 77,
      start: 0,
      end: 99,
      offset: undefined,
    });
  });

  it('顶部：从 0 开始，末尾多渲染一项', () => {
    // 100 项 × 20；容器 100 ⇒ 可见 0..4，第 5 项底 120 > 100 ⇒ endIndex = 5
    // 再多渲染一项 ⇒ end = 6
    expect(computeRange(makeInput())).toEqual({
      scrollHeight: 2000,
      start: 0,
      end: 6,
      offset: 0,
    });
  });

  it('⭐ start 用 >= ：项底**贴住**视口顶也算已进入', () => {
    // offsetTop = 20 时，第 0 项底正好 = 20 ⇒ 从第 0 项开始
    expect(computeRange(makeInput({ offsetTop: 20 })).start).toBe(0);
    // offsetTop = 21 时才从第 1 项开始
    expect(computeRange(makeInput({ offsetTop: 21 })).start).toBe(1);
  });

  it('⭐ end 用 > ：项底**正好贴住**视口底不算超出', () => {
    // 容器 100：第 4 项底 = 100（正好），第 5 项底 = 120（超出）
    // ⇒ endIndex = 5，再 +1 ⇒ end = 6
    expect(computeRange(makeInput({ height: 100 })).end).toBe(6);
    // 容器 120：第 5 项底正好 120 ⇒ 不超出；第 6 项底 140 超出 ⇒ endIndex = 6 ⇒ end = 7
    expect(computeRange(makeInput({ height: 120 })).end).toBe(7);
  });

  it('中段：start 与 offset 一起给出「这一段从哪开始」', () => {
    const result = computeRange(makeInput({ offsetTop: 25 }));
    expect(result.start).toBe(1);
    // 第 1 项的顶 = 20
    expect(result.offset).toBe(20);
    expect(result.end).toBe(7);
  });

  it('⭐ 未测量的项用 itemHeight 兜底（不是 0、不是跳过）', () => {
    // 前 3 项已测（各 50），其余用 20
    const heights = { get: (key: string) => (Number(key.split('-')[1]) < 3 ? 50 : undefined) };
    const result = computeRange(makeInput({ heights, offsetTop: 0 }));
    // 累计：50,100,150,170,190,210… 容器 100 ⇒ 第 1 项底 100 >= 0（start=0）
    // 第 2 项底 150 > 100 ⇒ endIndex = 2 ⇒ end = 3
    expect(result.start).toBe(0);
    expect(result.end).toBe(3);
    // scrollHeight = 3×50 + 97×20 = 150 + 1940 = 2090
    expect(result.scrollHeight).toBe(2090);
  });

  it('⭐ 滚过末尾（startIndex 找不到）⇒ 回到 0，end 取 ceil(height/itemHeight)', () => {
    const result = computeRange(makeInput({ offsetTop: 999_999 }));
    expect(result.start).toBe(0);
    expect(result.offset).toBe(0);
    // ceil(100 / 20) = 5 ⇒ end = min(6, 99) = 6
    expect(result.end).toBe(6);
    expect(result.scrollHeight).toBe(2000);
  });

  it('⭐ 容器比内容还高（endIndex 找不到）⇒ end = len - 1', () => {
    const result = computeRange(makeInput({ height: 5000 }));
    expect(result.start).toBe(0);
    expect(result.end).toBe(99);
    expect(result.scrollHeight).toBe(2000);
  });

  it('end 不会超过 len - 1（末尾多渲染一项后仍要夹住）', () => {
    const result = computeRange(makeInput({ height: 5000 }));
    expect(result.end).toBe(99);
  });

  it('空数据：scrollHeight 为 0，start 0 / end -1', () => {
    const result = computeRange(makeInput({ data: [] }));
    // 循环一次都没跑 ⇒ itemTop = 0；startIndex 兜底为 0；endIndex = ceil(100/20) = 5
    // ⇒ end = min(6, -1) = -1
    expect(result.scrollHeight).toBe(0);
    expect(result.start).toBe(0);
    expect(result.end).toBe(-1);
  });
});

describe('keepInRange（List.js:232-239）', () => {
  it('区间内原样返回', () => {
    expect(keepInRange(50, 100)).toBe(50);
  });

  it('上下界各自夹住', () => {
    expect(keepInRange(150, 100)).toBe(100);
    expect(keepInRange(-10, 100)).toBe(0);
  });

  it('⭐ NaN 的语义照抄：上界受保护、下界不受', () => {
    // 上界是 NaN ⇒ 跳过 min；下界 Math.max(NaN, 0) ⇒ NaN
    expect(Number.isNaN(keepInRange(Number.NaN, 100))).toBe(true);
    // 上界 NaN ⇒ 跳过；Math.max(Infinity, 0) ⇒ Infinity
    expect(keepInRange(Number.POSITIVE_INFINITY, Number.NaN)).toBe(Number.POSITIVE_INFINITY);
    // 下界仍然生效
    expect(keepInRange(-5, Number.NaN)).toBe(0);
    // 上界有效时正常夹住
    expect(keepInRange(500, 100)).toBe(100);
  });
});

describe('keepInHorizontalRange（List.js:291-297）', () => {
  it('区间内原样返回', () => {
    expect(keepInHorizontalRange(50, 300, 100)).toBe(50);
  });

  it('上界是 scrollWidth - 容器宽', () => {
    expect(keepInHorizontalRange(250, 300, 100)).toBe(200);
  });

  it('下界是 0', () => {
    expect(keepInHorizontalRange(-10, 300, 100)).toBe(0);
  });

  it('⭐ 没设 scrollWidth 时上界是 0 ⇒ 横向偏移被压成 0（不是「不钳制」）', () => {
    expect(keepInHorizontalRange(50, undefined, 100)).toBe(0);
  });

  it('⭐ scrollWidth 小于容器宽 ⇒ 上界为负，结果也可能是负的（上游如此）', () => {
    // max = 300 - 400 = -100；min(max(50, 0), -100) = -100
    expect(keepInHorizontalRange(50, 300, 400)).toBe(-100);
  });
});

describe('sumHeights（List.js:63）', () => {
  it('只累加 number，忽略 undefined', () => {
    expect(sumHeights({ a: 10, b: 20, c: undefined })).toBe(30);
  });

  it('空对象是 0', () => {
    expect(sumHeights({})).toBe(0);
  });
});
