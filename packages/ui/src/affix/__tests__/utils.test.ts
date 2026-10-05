/**
 * L1 · 判据纯函数单测
 *
 * `docs/analysis/affix.md` §3/§9：affix 的**行为本体**是三个纯函数 ——
 * `Affix.vue` 只是「测量 → 喂判据 → 应用结果」。所以把判据钉死，组件就有了一半的把握。
 *
 * ⚠️ 全部用**手造的 rect** 直接喂函数 —— jsdom 没有真实布局，
 *    `getBoundingClientRect()` 恒为 0（`docs/analysis/affix.md` §8）。
 */

import { describe, expect, it, vi } from 'vitest';
import { getFixedBottom, getFixedTop, getTargetRect, hasSameFixedPosition } from '../utils';

/** 手造一个矩形（省得每处都写全字段）。 */
const rect = (
  top: number,
  bottom: number,
  extra: { height?: number; width?: number; left?: number } = {},
) => ({
  top,
  bottom,
  ...extra,
});

describe('getFixedTop', () => {
  it('★ 占位还在视口顶部之下 ⇒ 不固钉（undefined）', () => {
    // target.top = 0，placeholder.top = 100，offsetTop = 64
    // 判据：0 > 100 - 64 = 36？否 ⇒ undefined
    expect(getFixedTop(rect(100, 200), rect(0, 800), 64)).toBeUndefined();
  });

  it('★ 占位滚到阈值之上 ⇒ 固钉，top = offsetTop + targetRect.top', () => {
    // placeholder.top = 20，target.top = 0，offsetTop = 64
    // 判据：0 > 20 - 64 = -44？是 ⇒ 64 + 0 = 64
    expect(getFixedTop(rect(20, 120), rect(0, 800), 64)).toBe(64);
  });

  it('★ target 本身滚动了：top 里要加上 targetRect.top', () => {
    // 滚动容器自己的 top 是 10（例如页面顶部有个 10px 的工具条）
    expect(getFixedTop(rect(20, 120), rect(10, 800), 64)).toBe(74);
  });

  it('⚠️ `offsetTop` 为 undefined 时恒不固钉（即使差值很大）', () => {
    expect(getFixedTop(rect(20, 120), rect(0, 800), undefined)).toBeUndefined();
  });

  it('⚠️ `Math.round` 只参与比较，**不参与结果**', () => {
    // target.top = 0.4 → round = 0；placeholder.top = 20.4 → round = 20
    // 比较：0 > 20 - 64 = -44 ⇒ 触发
    // 结果：64 + 0.4 = 64.4（**不是** 64 + 0 = 64）
    expect(getFixedTop(rect(20.4, 120), rect(0.4, 800), 64)).toBe(64.4);
  });

  it('★ 亚像素抖动被 round 消除：相邻两帧不会翻转固钉状态', () => {
    // 边界恰好压线：placeholder.top = 64，target.top = 0，offsetTop = 64
    // 比较：0 > 64 - 64 = 0？否（0 > 0 为假）⇒ 不固钉
    expect(getFixedTop(rect(64, 164), rect(0, 800), 64)).toBeUndefined();
    // 下一帧 placeholder.top = 63.9 → round 64；0 > 0 仍为假 ⇒ 仍不固钉
    expect(getFixedTop(rect(63.9, 163.9), rect(0, 800), 64)).toBeUndefined();
    // 63.4 → round 63；0 > 63 - 64 = -1 ⇒ 固钉
    expect(getFixedTop(rect(63.4, 163.4), rect(0, 800), 64)).toBe(64);
  });
});

describe('getFixedBottom', () => {
  const WIN_H = 800;

  it('★ 占位还在视口底部之上 ⇒ 不固钉', () => {
    vi.stubGlobal('innerHeight', WIN_H);
    try {
      // placeholder.bottom = 600，target.bottom = 800，offsetBottom = 64
      // 比较：800 < 600 + 64 = 664？否 ⇒ undefined
      expect(getFixedBottom(rect(500, 600), rect(0, 800), 64)).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('★ 占位压到阈值之下 ⇒ 固钉，bottom = offsetBottom + (innerHeight - targetRect.bottom)', () => {
    vi.stubGlobal('innerHeight', WIN_H);
    try {
      // placeholder.bottom = 760，target.bottom = 800
      // 比较：800 < 760 + 64 = 824？是 ⇒ 64 + (800 - 800) = 64
      expect(getFixedBottom(rect(660, 760), rect(0, 800), 64)).toBe(64);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('★ target 不是 window：bottom 要加上「target 底边到视口底边的距离」', () => {
    vi.stubGlobal('innerHeight', WIN_H);
    try {
      // target.bottom = 760（视口 800，工具条占了 40px）
      // ⇒ 64 + (800 - 760) = 104
      expect(getFixedBottom(rect(700, 750), rect(0, 760), 64)).toBe(104);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('⚠️ `offsetBottom` 为 undefined 时恒不固钉', () => {
    vi.stubGlobal('innerHeight', WIN_H);
    try {
      expect(getFixedBottom(rect(700, 780), rect(0, 800), undefined)).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('⚠️ `window.innerHeight` 参与**结果**，必须 mock（jsdom 默认 768，不是 800）', () => {
    // ⚠️ 不 mock 的后果：上面三条用例第一次跑全错 —— jsdom 的 innerHeight 是 768，
    //    结果整体偏移 32。这正是 `docs/analysis/affix.md` §8 预判的那条。
    vi.stubGlobal('innerHeight', WIN_H);
    try {
      expect(getFixedBottom(rect(660, 760), rect(0, 800), 64)).toBe(64);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('getTargetRect', () => {
  it('★ `window` ⇒ `{ top: 0, bottom: innerHeight }`，**没有** height/width', () => {
    vi.stubGlobal('innerHeight', 900);
    try {
      const r = getTargetRect(window);
      expect(r).toEqual({ top: 0, bottom: 900 });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('普通元素 ⇒ 直接返回 getBoundingClientRect()', () => {
    const el = {
      getBoundingClientRect: () => ({ top: 5, bottom: 505, height: 500, width: 100, left: 0 }),
    } as unknown as HTMLElement;
    expect(getTargetRect(el)).toEqual({ top: 5, bottom: 505, height: 500, width: 100, left: 0 });
  });

  it('⚠️ `null` ⇒ 走 window 分支（不会崩）', () => {
    vi.stubGlobal('innerHeight', 700);
    try {
      expect(getTargetRect(null)).toEqual({ top: 0, bottom: 700 });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('hasSameFixedPosition', () => {
  it('Vue 生成的 top/bottom 像素字符串与数值判据相同', () => {
    expect(hasSameFixedPosition({ top: '64px' }, 64, undefined)).toBe(true);
    expect(hasSameFixedPosition({ bottom: '12.5px' }, undefined, 12.5)).toBe(true);
  });

  it('也接受数值样式；不同位置不应命中快速返回', () => {
    expect(hasSameFixedPosition({ top: 64 }, 64, undefined)).toBe(true);
    expect(hasSameFixedPosition({ top: '65px' }, 64, undefined)).toBe(false);
  });

  it('没有可比较的位置时返回 false', () => {
    expect(hasSameFixedPosition(undefined, 64, undefined)).toBe(false);
    expect(hasSameFixedPosition({ top: '64px' }, undefined, undefined)).toBe(false);
  });
});

describe('几何判据不输出诊断日志', () => {
  it('getTargetRect / getFixedBottom 不向控制台输出调试信息', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubGlobal('innerHeight', 800);
    try {
      getTargetRect(null);
      getFixedBottom(rect(660, 760), rect(0, 800), 64);
      expect(log).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
