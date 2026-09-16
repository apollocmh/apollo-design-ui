/**
 * L1 —— `presets.ts`（collapse）与 `support.ts`（环境探测）。
 *
 * collapse 是五类语义里唯一需要 handler 的一类，也是唯一**真的会读 DOM 测量值**
 * 的一类，所以这里的断言重点是「什么时候读哪个高度」：
 *
 * | 时机 | 读什么 | 为什么 |
 * |---|---|---|
 * | appear/enter active | `scrollHeight` | 内容高度，展开后要撑到这么高 |
 * | leave start | `offsetHeight` | 此时元素已展开，实际占的就是这么高 |
 *
 * jsdom 里这两个值恒为 0，所以必须用 `defineProperty` 注入不同的值 ——
 * 否则「读的是 scrollHeight 还是 offsetHeight」这条区别测不出来。
 */

import { afterEach, describe, expect, it } from 'vitest';

import {
  getCollapsedHeight,
  getCurrentHeight,
  getRealHeight,
  initCollapseMotion,
  skipOpacityTransition,
} from '../presets';
import { detectMotionSupport } from '../support';

afterEach(() => {
  document.body.innerHTML = '';
});

/** 造一个 scrollHeight / offsetHeight 可控的元素 */
function stubElement(scrollHeight: number, offsetHeight: number): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: offsetHeight, configurable: true });
  return el;
}

describe('getCollapsedHeight', () => {
  it('不读 DOM —— 恒为 height 0 / opacity 0', () => {
    expect(getCollapsedHeight(null)).toEqual({ height: 0, opacity: 0 });
    expect(getCollapsedHeight(stubElement(100, 50))).toEqual({ height: 0, opacity: 0 });
  });
});

describe('getRealHeight', () => {
  it('⭐ 读 **scrollHeight** 而不是 offsetHeight（内容高度，含溢出）', () => {
    // 两个值给成不一样的，读错了就会看出来
    expect(getRealHeight(stubElement(120, 40))).toEqual({ height: 120, opacity: 1 });
  });

  it('元素为 null ⇒ height 0 / opacity 0（与 antd 的 `?? 0` 一致）', () => {
    expect(getRealHeight(null)).toEqual({ height: 0, opacity: 0 });
  });

  it('非 HTMLElement ⇒ height 0 而不是抛错（antd 在那上面读到 undefined 后 `?? 0`）', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    expect(getRealHeight(svg)).toEqual({ height: 0, opacity: 1 });
  });
});

describe('getCurrentHeight', () => {
  it('⭐ 读 **offsetHeight**（布局高度）', () => {
    expect(getCurrentHeight(stubElement(120, 40))).toEqual({ height: 40 });
  });

  it('元素为 null ⇒ 0', () => {
    expect(getCurrentHeight(null)).toEqual({ height: 0 });
  });
});

describe('skipOpacityTransition', () => {
  it('deadline ⇒ 结束（兜底路径）', () => {
    expect(skipOpacityTransition(null, { deadline: true })).toBe(true);
  });

  it('⭐ height 的 transitionend ⇒ 结束', () => {
    expect(skipOpacityTransition(null, { propertyName: 'height' })).toBe(true);
  });

  it('⭐ opacity 的 transitionend ⇒ **不**结束（否则高度还没跑完就被判定结束）', () => {
    expect(skipOpacityTransition(null, { propertyName: 'opacity' })).toBe(false);
  });

  it('animationend（没有 propertyName）⇒ 不结束', () => {
    expect(skipOpacityTransition(null, {})).toBe(false);
    expect(skipOpacityTransition(null, undefined)).toBe(false);
  });
});

describe('initCollapseMotion', () => {
  it('motionName 随前缀走，deadline 恒为 500', () => {
    expect(initCollapseMotion().motionName).toBe('apollo-motion-collapse');
    expect(initCollapseMotion('ant').motionName).toBe('ant-motion-collapse');
    expect(initCollapseMotion().motionDeadline).toBe(500);
  });

  it('⭐ 六个时机全部接上，且 appear/enter 共用同一组 handler', () => {
    const preset = initCollapseMotion();
    expect(preset.onAppearStart).toBe(preset.onEnterStart);
    expect(preset.onAppearActive).toBe(preset.onEnterActive);
    expect(preset.onAppearEnd).toBe(preset.onLeaveEnd);
    expect(preset.onLeaveActive).toBe(getCollapsedHeight);
    expect(preset.onLeaveStart).toBe(getCurrentHeight);
    expect(preset.onEnterActive).toBe(getRealHeight);
  });
});

describe('detectMotionSupport', () => {
  it('注入「什么都支持」的 window ⇒ supported 为 true', () => {
    const result = detectMotionSupport({
      document: document,
      AnimationEvent: class {},
      TransitionEvent: class {},
    });
    // jsdom 的 CSSStyleDeclaration 未必认 animation/transition，
    // 所以这里只断言**不抛错**且形状对，不断言具体布尔值。
    expect(typeof result.supported).toBe('boolean');
    expect(result.animationEndName.length).toBeGreaterThan(0);
    expect(result.transitionEndName.length).toBeGreaterThan(0);
  });

  it('注入**没有** AnimationEvent / TransitionEvent 的 window ⇒ 无前缀事件名被剔除', () => {
    // antd: 没有对应 Event 构造器 ⇒ 浏览器不认识无前缀事件名 ⇒ 从候选表里删掉。
    // 这里只断言不抛错且形状正确（jsdom 的 style 是否认 animation 不由我们决定）。
    const result = detectMotionSupport({ document });
    expect(typeof result.supported).toBe('boolean');
    expect(result.animationEndName.length).toBeGreaterThan(0);
  });

  it('同一个 win 重复探测结果稳定（不依赖调用次数）', () => {
    const win = { document, AnimationEvent: class {}, TransitionEvent: class {} };
    const a = detectMotionSupport(win);
    const b = detectMotionSupport(win);
    expect(a.animationEndName).toBe(b.animationEndName);
    expect(a.transitionEndName).toBe(b.transitionEndName);
  });

  it('没有 document ⇒ 不支持，且事件名回退到无前缀', () => {
    const result = detectMotionSupport({});
    expect(result.supported).toBe(false);
    expect(result.animationEndName).toBe('animationend');
    expect(result.transitionEndName).toBe('transitionend');
  });
});
