/**
 * L2 —— `useNextFrame()`（双 rAF）。
 *
 * 测的都是「错一帧就全错」的性质：
 *   1. 必须是**两**帧 —— 单帧在部分浏览器下会被合并，动画不从初始态开始；
 *   2. `cancel()` 与卸载都要真的把帧撤掉 —— 否则回调会在已销毁的元素上写样式。
 *
 * 用真实 rAF（jsdom 提供，约 16ms/帧）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import type { NextFrameHandle } from '../index';
import { useNextFrame } from '../index';

afterEach(() => {
  document.body.innerHTML = '';
});

/** 等一帧 */
function frame(): Promise<void> {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function mountHost(): {
  handle: NextFrameHandle;
  unmount: () => void;
} {
  let handle!: NextFrameHandle;
  const Host = defineComponent({
    setup() {
      handle = useNextFrame();
      return () => null;
    },
  });
  const wrapper = mount(Host);
  return { handle, unmount: () => wrapper.unmount() };
}

describe('useNextFrame', () => {
  it('⭐ 两帧后才触发 —— 一帧时不触发', async () => {
    const { handle, unmount } = mountHost();
    let called = 0;
    handle.request(() => {
      called += 1;
    });

    await frame();
    expect(called).toBe(0);

    await frame();
    expect(called).toBe(1);
    unmount();
  });

  it('cancel() 之后不再触发', async () => {
    const { handle, unmount } = mountHost();
    let called = 0;
    handle.request(() => {
      called += 1;
    });
    handle.cancel();

    await frame();
    await frame();
    expect(called).toBe(0);
    unmount();
  });

  it('⭐ 卸载时自动取消（onUnmounted）—— 不留悬挂的帧', async () => {
    const { handle, unmount } = mountHost();
    let called = 0;
    handle.request(() => {
      called += 1;
    });
    unmount();

    await frame();
    await frame();
    expect(called).toBe(0);
  });

  it('重复 request 会取消上一个（不会叠加）', async () => {
    const { handle, unmount } = mountHost();
    const calls: string[] = [];
    handle.request(() => calls.push('first'));
    handle.request(() => calls.push('second'));

    await frame();
    await frame();
    expect(calls).toEqual(['second']);
    unmount();
  });
});
