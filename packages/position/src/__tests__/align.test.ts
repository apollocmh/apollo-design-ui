import { describe, expect, it } from 'vitest';
import {
  type AlignContext,
  type AlignType,
  alignPopup,
  getPlacements,
  type Placement,
} from '../index';
import { alignOracle } from './oracle.js';

/**
 * AR1 的 PoC 验证。
 *
 * 分成两层：
 *   1. 语义层 —— 手写用例断言「几何含义正确」（浮层确实在目标下方、箭头确实在中心…）
 *   2. 差分层 —— 用生成的随机用例，断言我们的实现与 antd 参考实现**逐位一致**
 *
 * 只有第 2 层是 PoC 的实质证据：它证明「把定位拆成纯函数」这个架构决定
 * 不会丢失 antd 的任何行为细节。
 */

const PLACEMENTS = getPlacements({
  arrowWidth: 16,
  offset: 8,
  borderRadius: 8,
});

/** 确定性 PRNG（mulberry32）—— 测试必须可复现 */
function makeRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Case {
  ctx: AlignContext;
  align: AlignType;
  flip: Record<string, boolean | undefined>;
}

function generateCase(rand: () => number): Case {
  const pick = <T>(list: readonly T[]): T => {
    const index = Math.floor(rand() * list.length);
    const value = list[index];
    if (value === undefined) throw new Error('empty list');
    return value;
  };
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

  const target = { x: int(-50, 900), y: int(-50, 700), width: int(4, 300), height: int(4, 120) };
  const popup = { x: int(0, 400), y: int(0, 300), width: int(20, 320), height: int(10, 200) };

  // 视口：有时故意开得极小，制造大量溢出场景
  const vw = int(60, 1200);
  const vh = int(60, 800);
  const visible = { left: int(-40, 60), top: int(-40, 60), right: 0, bottom: 0 };
  visible.right = visible.left + vw;
  visible.bottom = visible.top + vh;

  const scroll = {
    left: visible.left - int(0, 300),
    top: visible.top - int(0, 300),
    right: visible.right + int(0, 300),
    bottom: visible.bottom + int(0, 300),
  };

  const placement = pick(Object.keys(PLACEMENTS) as Placement[]);
  const align: AlignType = { ...PLACEMENTS[placement] };

  // 覆盖三种 htmlRegion
  const region = pick(['visible', 'scroll', 'visibleFirst'] as const);
  align.htmlRegion = region;

  // 随机覆盖 overflow，制造 adjust / shift 的各种组合
  if (rand() < 0.3) {
    align.overflow = {
      adjustX: rand() < 0.5,
      adjustY: rand() < 0.5,
      shiftX: rand() < 0.5 ? true : int(0, 40),
      shiftY: rand() < 0.5 ? true : int(0, 40),
    };
  } else if (rand() < 0.15) {
    align.overflow = { adjustX: false, adjustY: false };
  }

  // 随机 offset（含百分比）
  if (rand() < 0.3) {
    align.offset = [rand() < 0.5 ? int(-30, 30) : `${int(-40, 40)}%`, int(-30, 30)];
  }
  if (rand() < 0.2) {
    align.targetOffset = [int(-20, 20), rand() < 0.5 ? int(-20, 20) : `${int(-30, 30)}%`];
  }

  const scaleX = rand() < 0.15 ? 1.5 : 1;
  const scaleY = rand() < 0.15 ? 2 : 1;

  return {
    ctx: { target, popup, visible, scroll, scaleX, scaleY },
    align,
    flip: {
      bt: rand() < 0.2 ? true : undefined,
      tb: rand() < 0.2 ? true : undefined,
      rl: rand() < 0.2 ? true : undefined,
      lr: rand() < 0.2 ? true : undefined,
    },
  };
}

describe('AR1 PoC · 语义层：几何含义正确', () => {
  const target = { x: 100, y: 100, width: 80, height: 32 };
  const popup = { x: 0, y: 0, width: 200, height: 60 };
  const visible = { left: 0, top: 0, right: 1200, bottom: 800 };
  const ctx: AlignContext = { target, popup, visible, scroll: visible };

  it('bottom：浮层上边缘中点对齐目标下边缘中点，间距 = 箭头半宽 + offset', () => {
    const align = PLACEMENTS.bottom;
    const r = alignPopup(ctx, align);

    expect(align.offset?.[1]).toBe(8 + 8); // halfArrowWidth(8) + offset(8)
    expect(r.points).toEqual(['tc', 'bc']);

    // 浮层移动后的实际位置
    const movedX = popup.x + r.offsetX;
    const movedY = popup.y + r.offsetY;
    expect(movedX + popup.width / 2).toBe(target.x + target.width / 2); // 水平居中
    expect(movedY).toBe(target.y + target.height + 16); // 垂直：目标下方 16px
  });

  it('top：浮层在目标上方，垂直间距对称', () => {
    const r = alignPopup(ctx, PLACEMENTS.top);
    const movedY = popup.y + r.offsetY;
    expect(movedY + popup.height).toBe(target.y - 16);
  });

  it('left / right：水平间距对称，垂直居中', () => {
    // 目标需要离视口左右边界足够远，否则会触发合法的翻转 ——
    // 这里要验证的是「无溢出时的几何」，翻转另有专门用例。
    const wide: AlignContext = {
      ...ctx,
      target: { x: 500, y: 100, width: 80, height: 32 },
    };

    const left = alignPopup(wide, PLACEMENTS.left);
    expect(left.flip.lr).toBeFalsy();
    expect(popup.x + left.offsetX + popup.width).toBe(500 - 16);
    expect(popup.y + left.offsetY + popup.height / 2).toBe(100 + 32 / 2);

    const right = alignPopup(wide, PLACEMENTS.right);
    expect(right.flip.rl).toBeFalsy();
    expect(popup.x + right.offsetX).toBe(500 + 80 + 16);
    expect(popup.y + right.offsetY + popup.height / 2).toBe(100 + 32 / 2);
  });

  it('目标贴边时翻转是合法的：left 会翻到 right', () => {
    // 目标离左边太近，浮层放不下 → 翻到右侧。这不是 bug，是 antd 的行为。
    const r = alignPopup(ctx, PLACEMENTS.left);
    expect(r.flip.lr).toBe(true);
    expect(r.points).toEqual(['cl', 'cr']);
    expect(popup.x + r.offsetX).toBeGreaterThan(target.x);
  });

  it('箭头落在浮层与目标的交叉区中心', () => {
    const r = alignPopup(ctx, PLACEMENTS.bottom);
    const movedX = popup.x + r.offsetX;
    // 目标比浮层窄，交叉区就是目标本身 → 箭头应指向目标中心
    expect(r.arrowX).toBe(target.x + target.width / 2 - movedX);
  });

  it('角 placement 按角对齐（topLeft 的左边对齐目标左边）', () => {
    const r = alignPopup(ctx, PLACEMENTS.topLeft);
    expect(r.points).toEqual(['bl', 'tl']);
    expect(popup.x + r.offsetX).toBe(target.x);
    expect(popup.y + r.offsetY + popup.height).toBe(target.y - 16);
  });
});

describe('AR1 PoC · 差分层：与 antd 参考实现逐位一致', () => {
  it('5000 组生成用例的 offset / arrow / points / flip 全部一致', () => {
    const rand = makeRandom(20260916);
    let flipChecks = 0;

    for (let i = 0; i < 5000; i += 1) {
      const { ctx, align, flip } = generateCase(rand);
      const ours = alignPopup(ctx, align, flip);
      const theirs = alignOracle({
        target: ctx.target,
        popup: ctx.popup,
        visible: ctx.visible,
        scroll: ctx.scroll,
        align,
        flip,
        scaleX: ctx.scaleX,
        scaleY: ctx.scaleY,
        // 已登记的有意差异（intersection-area-clamp）：让 oracle 采用与本项目
        // 一致的逐轴夹取，从而证明「除这一处外，移植是保真的」。
        clampIntersection: true,
      });

      const label = `case#${i} placement=${align.points?.join('/')} region=${align.htmlRegion}`;

      expect(ours.offsetX, `${label} offsetX`).toBe(theirs.offsetX);
      expect(ours.offsetY, `${label} offsetY`).toBe(theirs.offsetY);
      expect(ours.arrowX, `${label} arrowX`).toBe(theirs.arrowX);
      expect(ours.arrowY, `${label} arrowY`).toBe(theirs.arrowY);
      expect(ours.points, `${label} points`).toEqual(theirs.points);

      // flip 记忆：只比较布尔语义（我们的实现省略 undefined 键）
      for (const key of ['bt', 'tb', 'rl', 'lr'] as const) {
        expect(!!ours.flip[key], `${label} flip.${key}`).toBe(!!theirs.flip[key]);
        if (ours.flip[key] !== undefined || theirs.flip[key] !== undefined) flipChecks += 1;
      }
    }

    // 差分必须有实际覆盖，否则这个测试是空的
    expect(flipChecks).toBeGreaterThan(0);
  });

  it('登记差异 intersection-area-clamp 确实会改变结果：不开夹取时有分歧，开夹取时为零分歧', () => {
    // 这条用例的作用是让「已登记的差异」变成可证伪的断言。
    // 如果哪天 antd 修了这个缺陷，本测试会失败 —— 那就该回来撤销登记。
    const rand = makeRandom(20260916);
    let divergedWithoutClamp = 0;
    let divergedWithClamp = 0;

    for (let i = 0; i < 5000; i += 1) {
      const { ctx, align, flip } = generateCase(rand);
      const ours = alignPopup(ctx, align, flip);
      const base = {
        target: ctx.target,
        popup: ctx.popup,
        visible: ctx.visible,
        scroll: ctx.scroll,
        align,
        flip,
        scaleX: ctx.scaleX,
        scaleY: ctx.scaleY,
      };

      const antdVerbatim = alignOracle({ ...base, clampIntersection: false });
      const antdClamped = alignOracle({ ...base, clampIntersection: true });

      if (ours.offsetX !== antdVerbatim.offsetX || ours.offsetY !== antdVerbatim.offsetY) {
        divergedWithoutClamp += 1;
      }
      if (ours.offsetX !== antdClamped.offsetX || ours.offsetY !== antdClamped.offsetY) {
        divergedWithClamp += 1;
      }
    }

    expect(divergedWithoutClamp).toBeGreaterThan(0); // 差异真实存在
    expect(divergedWithClamp).toBe(0); // 且是唯一差异
  });

  it('翻转记忆决定临界点：不溢出时，有记忆才翻、无记忆不翻', () => {
    const align = PLACEMENTS.bottom;
    // 上下都放得下、可见面积相等 —— 此时只有翻转记忆能决定结果
    const ctx: AlignContext = {
      target: { x: 400, y: 400, width: 100, height: 40 },
      popup: { x: 0, y: 0, width: 240, height: 200 },
      visible: { left: 0, top: 0, right: 800, bottom: 900 },
      scroll: { left: 0, top: 0, right: 800, bottom: 900 },
    };

    const fresh = alignPopup(ctx, align);
    expect(fresh.flip.bt).toBeFalsy();
    expect(fresh.points).toEqual(['tc', 'bc']); // 保持在下

    const sticky = alignPopup(ctx, align, { bt: true });
    expect(sticky.flip.bt).toBe(true);
    expect(sticky.points).toEqual(['bc', 'tc']); // 记忆使其维持在上
    expect(ctx.popup.y + sticky.offsetY + ctx.popup.height).toBe(400 - 16);
  });

  it('翻转记忆不会强迫一个明显更差的翻转', () => {
    const align = PLACEMENTS.bottom;
    // 视口足够高，翻到上方会大幅掉出视口 → 即使有记忆也会被否决
    const ctx: AlignContext = {
      target: { x: 300, y: 60, width: 100, height: 40 },
      popup: { x: 0, y: 0, width: 240, height: 200 },
      visible: { left: 0, top: 0, right: 800, bottom: 900 },
      scroll: { left: 0, top: 0, right: 800, bottom: 900 },
    };
    const r = alignPopup(ctx, align, { bt: true });
    expect(r.flip.bt).toBe(false);
    expect(r.points).toEqual(['tc', 'bc']);
  });

  it('溢出时确实会翻转', () => {
    const align = PLACEMENTS.bottom;
    const tight: AlignContext = {
      target: { x: 300, y: 60, width: 100, height: 40 },
      popup: { x: 0, y: 0, width: 240, height: 200 },
      visible: { left: 0, top: 0, right: 800, bottom: 150 },
      scroll: { left: 0, top: 0, right: 800, bottom: 150 },
    };
    const r = alignPopup(tight, align);
    expect(r.flip.bt).toBe(true);
    expect(r.points).toEqual(['bc', 'tc']);
  });

  it('shift：越界时把浮层推回可视区，且不会飞离目标', () => {
    // 目标贴着视口右边，浮层溢出 → 应被推回，且箭头仍在浮层内
    const ctx: AlignContext = {
      target: { x: 760, y: 200, width: 40, height: 30 },
      popup: { x: 0, y: 0, width: 300, height: 80 },
      visible: { left: 0, top: 0, right: 800, bottom: 600 },
      scroll: { left: 0, top: 0, right: 800, bottom: 600 },
    };
    const r = alignPopup(ctx, PLACEMENTS.top);
    const movedRight = ctx.popup.x + r.offsetX + ctx.popup.width;

    expect(movedRight).toBeLessThanOrEqual(800);
    expect(r.arrowX).toBeGreaterThanOrEqual(0);
    expect(r.arrowX).toBeLessThanOrEqual(ctx.popup.width);

    // 与参考实现一致
    const theirs = alignOracle({
      target: ctx.target,
      popup: ctx.popup,
      visible: ctx.visible,
      scroll: ctx.scroll,
      align: PLACEMENTS.top,
      flip: {},
    });
    expect(r.offsetX).toBe(theirs.offsetX);
    expect(r.offsetY).toBe(theirs.offsetY);
  });

  it('CSS 缩放：非 1 的 scale 不取整，且除以 scale', () => {
    const ctx: AlignContext = {
      target: { x: 100.6, y: 100.4, width: 80, height: 32 },
      popup: { x: 0, y: 0, width: 200, height: 60 },
      visible: { left: 0, top: 0, right: 1200, bottom: 800 },
      scroll: { left: 0, top: 0, right: 1200, bottom: 800 },
      scaleX: 1.5,
      scaleY: 2,
    };
    const ours = alignPopup(ctx, PLACEMENTS.bottom);
    const theirs = alignOracle({
      target: ctx.target,
      popup: ctx.popup,
      visible: ctx.visible,
      scroll: ctx.scroll,
      align: PLACEMENTS.bottom,
      flip: {},
      scaleX: 1.5,
      scaleY: 2,
    });
    expect(ours.offsetX).toBe(theirs.offsetX);
    expect(ours.offsetY).toBe(theirs.offsetY);
    // 有缩放时不应出现 floor 造成的整像素对齐
    expect(ours.offsetX).not.toBe(Math.floor(ours.offsetX * 1.5) / 1.5);
  });
});
