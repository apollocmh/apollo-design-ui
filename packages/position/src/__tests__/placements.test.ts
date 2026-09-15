import { describe, expect, it } from 'vitest';
import type { Placement } from '../index';
import {
  ARROW_CENTER_PLACEMENT_POINTS,
  getArrowOffsetToken,
  getOverflowOptions,
  getPlacements,
  PLACEMENT_POINTS,
} from '../index';

/**
 * 期望值逐条来自 antd 6.6.4 `es/_util/placements.js`。
 * 这些数字（尤其是 offset 与 overflow）是视觉一致性的基础 —— 改错一个像素，
 * Tooltip 与 antd 的截图就对不上。
 */

const BASE = { arrowWidth: 16, offset: 8, borderRadius: 8 } as const;

describe('PLACEMENT_POINTS', () => {
  it('12 个 placement 的点与 antd 的 PlacementAlignMap 一致', () => {
    expect(PLACEMENT_POINTS).toEqual({
      left: ['cr', 'cl'],
      right: ['cl', 'cr'],
      top: ['bc', 'tc'],
      bottom: ['tc', 'bc'],
      topLeft: ['bl', 'tl'],
      leftTop: ['tr', 'tl'],
      topRight: ['br', 'tr'],
      rightTop: ['tl', 'tr'],
      bottomRight: ['tr', 'br'],
      rightBottom: ['bl', 'br'],
      bottomLeft: ['tl', 'bl'],
      leftBottom: ['br', 'bl'],
    });
  });

  it('arrowPointAtCenter 只影响 8 个角 placement', () => {
    expect(Object.keys(ARROW_CENTER_PLACEMENT_POINTS).sort()).toEqual([
      'bottomLeft',
      'bottomRight',
      'leftBottom',
      'leftTop',
      'rightBottom',
      'rightTop',
      'topLeft',
      'topRight',
    ]);
    expect(ARROW_CENTER_PLACEMENT_POINTS.topLeft).toEqual(['bl', 'tc']);
    expect(ARROW_CENTER_PLACEMENT_POINTS.leftBottom).toEqual(['br', 'cl']);
  });
});

describe('getArrowOffsetToken', () => {
  it('圆角 ≤ 12 时固定 12', () => {
    expect(getArrowOffsetToken(8)).toEqual({ arrowOffsetHorizontal: 12, arrowOffsetVertical: 8 });
    expect(getArrowOffsetToken(12)).toEqual({ arrowOffsetHorizontal: 12, arrowOffsetVertical: 8 });
  });

  it('圆角 > 12 时 +2，垂直方向仍受 MAX_VERTICAL_CONTENT_RADIUS(8) 限制', () => {
    expect(getArrowOffsetToken(16)).toEqual({ arrowOffsetHorizontal: 18, arrowOffsetVertical: 8 });
    expect(getArrowOffsetToken(20)).toEqual({ arrowOffsetHorizontal: 22, arrowOffsetVertical: 8 });
  });
});

describe('getOverflowOptions', () => {
  it('top / bottom：水平方向平移，垂直方向翻转', () => {
    expect(getOverflowOptions('top', 16, 8)).toEqual({
      shiftX: 40, // 12 * 2 + 16
      shiftY: true,
      adjustY: true,
    });
    expect(getOverflowOptions('bottom', 16, 8)).toEqual({
      shiftX: 40,
      shiftY: true,
      adjustY: true,
    });
  });

  it('left / right：垂直方向平移，水平方向翻转', () => {
    expect(getOverflowOptions('left', 16, 8)).toEqual({
      shiftY: 32, // 8 * 2 + 16
      shiftX: true,
      adjustX: true,
    });
  });

  it('8 个角只翻转不平移（baseOverflow 为空，两轴回退为 adjust）', () => {
    expect(getOverflowOptions('topLeft', 16, 8)).toEqual({ adjustX: true, adjustY: true });
    expect(getOverflowOptions('rightBottom', 16, 8)).toEqual({ adjustX: true, adjustY: true });
  });

  it('autoAdjustOverflow=false 时完全关闭', () => {
    expect(getOverflowOptions('top', 16, 8, false)).toEqual({ adjustX: false, adjustY: false });
  });

  it('对象形式覆盖默认值', () => {
    expect(getOverflowOptions('top', 16, 8, { shiftX: 0 })).toEqual({
      shiftX: 0,
      shiftY: true,
      adjustY: true,
      // ⚠️ antd 用 `!merged.shiftX` 判断「是否已有平移」，0 是 falsy，
      // 所以补了 adjustX。这是 antd 的真实行为，我们保持一致 ——
      // 副作用是「显式传 shiftX: 0」无法真正关掉翻转，要关掉得传 adjustX: false。
      adjustX: true,
    });
  });

  it('shiftX 为 0 时仍视为「有平移」，因此不会补……不对，是仍会补 adjustX', () => {
    // antd 用 !merged.shiftX 判断，0 是 falsy —— 这是它的真实行为，不是笔误
    expect(getOverflowOptions('topLeft', 16, 8, { shiftX: 0 }).adjustX).toBe(true);
  });
});

describe('getPlacements', () => {
  it('产出 12 个 placement', () => {
    expect(Object.keys(getPlacements(BASE)).sort()).toEqual([
      'bottom',
      'bottomLeft',
      'bottomRight',
      'left',
      'leftBottom',
      'leftTop',
      'right',
      'rightBottom',
      'rightTop',
      'top',
      'topLeft',
      'topRight',
    ]);
  });

  it('静态 offset 含箭头半宽 + 间距', () => {
    const p = getPlacements(BASE);
    expect(p.top.offset).toEqual([0, -16]); // -(8 + 8)
    expect(p.bottom.offset).toEqual([0, 16]);
    expect(p.left.offset).toEqual([-16, 0]);
    expect(p.right.offset).toEqual([16, 0]);
    expect(p.topLeft.offset).toEqual([0, -16]);
    expect(p.rightBottom.offset).toEqual([16, 0]);
  });

  it('全部带 dynamicInset', () => {
    for (const placement of Object.keys(getPlacements(BASE)) as Placement[]) {
      expect(getPlacements(BASE)[placement].dynamicInset).toBe(true);
    }
  });

  it('8 个角关闭 autoArrow，4 个正向 placement 不设该字段', () => {
    const p = getPlacements(BASE);
    expect(p.topLeft.autoArrow).toBe(false);
    expect(p.rightBottom.autoArrow).toBe(false);
    expect(p.top.autoArrow).toBeUndefined();
    expect(p.left.autoArrow).toBeUndefined();
  });

  it('arrowPointAtCenter 改写 8 个角的点与补偿偏移', () => {
    const p = getPlacements({ ...BASE, arrowPointAtCenter: true });
    expect(p.topLeft.points).toEqual(['bl', 'tc']);
    expect(p.topLeft.offset).toEqual([-20, -16]); // -(12 + 8), -(8 + 8)
    expect(p.topRight.offset).toEqual([20, -16]);
    expect(p.leftTop.offset).toEqual([-16, -16]); // -12*2 + 8
    expect(p.leftBottom.offset).toEqual([-16, 16]); // 12*2 - 8
  });

  it('visibleFirst 给全部 placement 打上 htmlRegion', () => {
    const p = getPlacements({ ...BASE, visibleFirst: true });
    for (const placement of Object.keys(p) as Placement[]) {
      expect(p[placement].htmlRegion).toBe('visibleFirst');
    }
  });

  it('每个 placement 都带 overflow 配置', () => {
    const p = getPlacements(BASE);
    for (const placement of Object.keys(p) as Placement[]) {
      expect(p[placement].overflow).toBeDefined();
    }
  });
});
