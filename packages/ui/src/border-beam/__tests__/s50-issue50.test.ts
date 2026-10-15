/**
 * Issue #50 · [BorderBeam] 多实例轮询样式读取的性能预算（运行时量化）
 *
 * 背景：宿主 `border-width` 变化**不触发** ResizeObserver（`box-sizing: border-box` 下
 * border-box 尺寸不变）、也没有对应事件 ⇒ 本仓用 500ms 轻量轮询跟随（上游 antd 只在
 * `domNode` 变化时读一次，本仓这是**有意的增强**，见 README 差异表）。
 * 但「每实例一个定时器 + 隐藏页照读」在多实例下成本不可忽略：
 *   1. N 个实例 ⇒ N 个 `setInterval`（应共享成一个）；
 *   2. `document.hidden` 时仍在 `getComputedStyle`（后台标签的 interval 节流
 *      省不掉样式重算）（应跳过，并在回到可见时补一次）；
 *   3. 全部卸载后必须停表（守卫，当前已满足）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

import BorderBeam from '../BorderBeam';

const SAMPLER_DELAY = 500;

const gcsSpy = vi.spyOn(globalThis, 'getComputedStyle');
const intervalSpy = vi.spyOn(globalThis, 'setInterval');
const clearSpy = vi.spyOn(globalThis, 'clearInterval');

const setHidden = (hidden: boolean): void => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
};

const mountBeams = (count: number) =>
  mount({
    setup: () => () =>
      h(
        'div',
        Array.from({ length: count }, (_, i) =>
          h(BorderBeam, { key: i, color: '#1677ff' }, () => h('div', 'x')),
        ),
      ),
  });

/** 只看本组件注册的那个 500ms 定时器。 */
const samplerIntervals = () => intervalSpy.mock.calls.filter((call) => call[1] === SAMPLER_DELAY);

beforeEach(() => {
  gcsSpy.mockClear();
  intervalSpy.mockClear();
  clearSpy.mockClear();
  setHidden(false);
});

afterEach(() => {
  vi.useRealTimers();
  setHidden(false);
  delete (document as unknown as Record<string, unknown>).hidden;
});

describe('BorderBeam · Issue #50 轮询采样预算', () => {
  it('[A] 多实例共享调度：3 个实例只注册 1 个定时器（核心回归）', () => {
    const wrapper = mountBeams(3);
    expect(samplerIntervals()).toHaveLength(1);
    wrapper.unmount();
  });

  it('[B] 页面隐藏时不采样；回到可见补一次（核心回归）', () => {
    vi.useFakeTimers();
    const wrapper = mountBeams(2);

    setHidden(true);
    gcsSpy.mockClear();
    vi.advanceTimersByTime(SAMPLER_DELAY * 4);
    expect(gcsSpy).not.toHaveBeenCalled();

    // 回到可见 ⇒ 立刻补一次（保证状态不滞后到下一个 tick）
    setHidden(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(gcsSpy).toHaveBeenCalled();

    wrapper.unmount();
  });

  it('[C] 守卫：全部卸载后停表（不再有任何采样）', () => {
    vi.useFakeTimers();
    const wrapper = mountBeams(2);
    wrapper.unmount();

    clearSpy.mockClear();
    gcsSpy.mockClear();
    vi.advanceTimersByTime(SAMPLER_DELAY * 4);
    expect(gcsSpy).not.toHaveBeenCalled();
  });
});
