import { describe, expect, it } from 'vitest';
import type { Area, Rect } from '../index';
import {
  alignPointOf,
  clipArea,
  flatPoint,
  getAlignPoint,
  getIntersectionArea,
  getNumberOffset,
  getUnitOffset,
  rectToArea,
  reversePoint,
  splitPoints,
} from '../index';

const rect: Rect = { x: 100, y: 200, width: 80, height: 40 };

describe('splitPoints', () => {
  it('把两字符点拆成 [垂直, 水平]', () => {
    expect(splitPoints('tl')).toEqual(['t', 'l']);
    expect(splitPoints('cc')).toEqual(['c', 'c']);
  });

  it('空串兜底为中心 —— 与 antd 的 fallthrough 到 center 语义一致', () => {
    expect(splitPoints('')).toEqual(['c', 'c']);
  });
});

describe('getAlignPoint', () => {
  it('覆盖 9 个点的组合', () => {
    expect(getAlignPoint(rect, ['t', 'l'])).toEqual({ x: 100, y: 200 });
    expect(getAlignPoint(rect, ['t', 'c'])).toEqual({ x: 140, y: 200 });
    expect(getAlignPoint(rect, ['t', 'r'])).toEqual({ x: 180, y: 200 });
    expect(getAlignPoint(rect, ['c', 'l'])).toEqual({ x: 100, y: 220 });
    expect(getAlignPoint(rect, ['c', 'c'])).toEqual({ x: 140, y: 220 });
    expect(getAlignPoint(rect, ['c', 'r'])).toEqual({ x: 180, y: 220 });
    expect(getAlignPoint(rect, ['b', 'l'])).toEqual({ x: 100, y: 240 });
    expect(getAlignPoint(rect, ['b', 'c'])).toEqual({ x: 140, y: 240 });
    expect(getAlignPoint(rect, ['b', 'r'])).toEqual({ x: 180, y: 240 });
  });

  it('alignPointOf 接受字符串形式', () => {
    expect(alignPointOf(rect, 'bc')).toEqual({ x: 140, y: 240 });
  });
});

describe('reversePoint', () => {
  it('t↔b、l↔r，c 保持 c', () => {
    expect(reversePoint(['t', 'l'], 0)).toEqual(['b', 'l']);
    expect(reversePoint(['b', 'r'], 0)).toEqual(['t', 'r']);
    expect(reversePoint(['t', 'l'], 1)).toEqual(['t', 'r']);
    expect(reversePoint(['c', 'c'], 0)).toEqual(['c', 'c']);
    expect(reversePoint(['c', 'c'], 1)).toEqual(['c', 'c']);
  });

  it('flatPoint 拼回字符串', () => {
    expect(flatPoint(['t', 'l'])).toBe('tl');
    expect(flatPoint(['c', 'c'])).toBe('cc');
  });
});

describe('getUnitOffset', () => {
  it('数字原样返回', () => {
    expect(getUnitOffset(200, 12)).toBe(12);
    expect(getUnitOffset(200, -8)).toBe(-8);
  });

  it('百分比相对传入尺寸', () => {
    expect(getUnitOffset(200, '50%')).toBe(100);
    expect(getUnitOffset(200, '0%')).toBe(0);
    expect(getUnitOffset(200, '150%')).toBe(300);
  });

  it('省略时视为 0', () => {
    expect(getUnitOffset(200)).toBe(0);
  });

  it('非数字百分比保留 NaN —— 与 antd 的 parseFloat 行为一致，不擅自兜底', () => {
    // 'abc%' 不是合法的 OffsetType（模板字面量类型只接受 `${number}%`）。
    // 这里刻意越界传入，是为了锁住「不擅自兜底」这条行为 —— antd 的 parseFloat 会产出 NaN，
    // 我们不打算把它悄悄变成 0，因为那会掩盖调用方的拼写错误。
    const malformed = 'abc%' as unknown as Parameters<typeof getUnitOffset>[1];
    expect(Number.isNaN(getUnitOffset(200, malformed))).toBe(true);
  });
});

describe('getNumberOffset', () => {
  it('按矩形宽高解析 [x, y]', () => {
    expect(getNumberOffset({ x: 0, y: 0, width: 100, height: 40 }, [10, '50%'])).toEqual([10, 20]);
  });

  it('未传时返回 [0, 0]', () => {
    expect(getNumberOffset(rect)).toEqual([0, 0]);
  });
});

describe('getIntersectionArea', () => {
  const area: Area = { left: 0, top: 0, right: 1000, bottom: 600 };

  it('完全在区域内 = 浮层面积', () => {
    expect(getIntersectionArea({ x: 0, y: 0, width: 200, height: 100 }, 100, 100, area)).toBe(
      20000,
    );
  });

  it('部分越界只算相交部分', () => {
    // 位移后左边界到 -50，只有 150 宽可见
    expect(getIntersectionArea({ x: 0, y: 0, width: 200, height: 100 }, -50, 0, area)).toBe(15000);
  });

  it('完全越界为 0，不会为负', () => {
    expect(getIntersectionArea({ x: 0, y: 0, width: 200, height: 100 }, 5000, 5000, area)).toBe(0);
  });

  it('负尺寸被夹到 0（区域本身退化时）', () => {
    const degenerate: Area = { left: 0, top: 0, right: -10, bottom: -10 };
    expect(getIntersectionArea({ x: 0, y: 0, width: 10, height: 10 }, 0, 0, degenerate)).toBe(0);
  });

  it('【登记差异 intersection-area-clamp】完全在区域外侧时，antd 会算出正面积，我们算 0', () => {
    // 浮层整体位于区域右下方：
    //   width  = min(5200, 1000) - max(5000, 0) = -4000
    //   height = min(5200,  600) - max(5000, 0) = -4400
    // antd：Math.max(0, -4000 * -4400) = 17_600_000  ← 「完全不可见」被算成巨大正面积
    // 我们：Math.max(0, -4000) * Math.max(0, -4400) = 0
    const antdWouldSay = Math.max(0, -4000 * -4400);
    expect(antdWouldSay).toBe(17_600_000);
    expect(getIntersectionArea({ x: 0, y: 0, width: 200, height: 200 }, 5000, 5000, area)).toBe(0);
  });

  it('【登记差异 intersection-area-clamp】单轴在外、单轴在内时同样为 0', () => {
    // width 负、height 正 → antd 得到负数后被 max(0,·) 夹成 0，与我们一致。
    // 这条用例锁住「两式在常见部分相交情形下等价」的边界。
    expect(getIntersectionArea({ x: 0, y: 0, width: 200, height: 100 }, 5000, 0, area)).toBe(0);
  });
});

describe('clipArea', () => {
  it('逐个滚动容器取交集', () => {
    const init: Area = { left: 0, top: 0, right: 1000, bottom: 800 };
    const clipped = clipArea(init, [
      { left: 100, top: 50, right: 900, bottom: 700 },
      { left: 200, top: 0, right: 800, bottom: 600 },
    ]);
    expect(clipped).toEqual({ left: 200, top: 50, right: 800, bottom: 600 });
  });

  it('不修改传入的初始区域', () => {
    const init: Area = { left: 0, top: 0, right: 100, bottom: 100 };
    clipArea(init, [{ left: 10, top: 10, right: 90, bottom: 90 }]);
    expect(init).toEqual({ left: 0, top: 0, right: 100, bottom: 100 });
  });
});

describe('rectToArea', () => {
  it('把 x/y/width/height 转成 left/top/right/bottom', () => {
    expect(rectToArea(rect)).toEqual({ left: 100, top: 200, right: 180, bottom: 240 });
  });
});
