/**
 * Issue #53 · [Tour] 异步布局变化后的目标定位（运行时对拍）
 *
 * 上游判据（rc-tour 2.4.0 `es/hooks/useTarget.js`）—— `updatePos` 的触发集**只有**：
 *   1. `useLayoutEffect(..., [targetElement, open, updatePos])`：挂载 + `target`/`open` 变化；
 *   2. `window` 的 `resize` / `scroll`。
 * **没有** ResizeObserver / MutationObserver / 轮询。
 *
 * ⇒ 目标元素在容器内被**异步内容**（图片加载、手风琴展开）推移时，antd 也不会重定位；
 *   只有窗口 resize/scroll、切 step、或 open 变化才会重算。
 * 本仓逐字复刻同一触发集（`watch([targetElement, mergedOpen])` + onMounted + resize/scroll）
 * ⇒ 按 Issue 自己的判据（「如果同样受限，区分增强需求而非兼容 Bug」）**判为非缺陷**。
 *
 * 下面把触发集**两个方向**都钉住：不触发时不重算（表征）、触发时立刻重算（回归），
 * 免得以后有人把它当 BUG 去加 ResizeObserver（那会与上游行为分叉）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { Tour } from '../index';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 可变的 rect：`getBoundingClientRect` 每次现读那个对象。 */
function makeMutableTarget(rect: Rect) {
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = 'target';
  document.body.appendChild(el);
  el.getBoundingClientRect = (() =>
    ({
      x: rect.x,
      y: rect.y,
      left: rect.x,
      top: rect.y,
      width: rect.width,
      height: rect.height,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height,
      toJSON: () => ({}),
    }) as DOMRect) as typeof el.getBoundingClientRect;
  return { el, rect, restore: () => el.remove() };
}

const hole = () => document.querySelector('.apollo-tour-placeholder-animated');

const holeXY = () => ({ x: hole()?.getAttribute('x'), y: hole()?.getAttribute('y') });

async function waitOpen(): Promise<void> {
  await vi
    .waitUntil(() => document.querySelector('.apollo-tour-panel') !== null, { timeout: 2000 })
    .catch(() => {});
  await nextTick();
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Tour · Issue #53 异步布局变化后的定位', () => {
  it('[A] 只改目标 rect（模拟异步推移）⇒ **不重定位**（与上游同触发集）', async () => {
    const t = makeMutableTarget({ x: 100, y: 200, width: 100, height: 50 });
    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        steps: [{ title: 'T', description: '', target: () => t.el }],
      },
    });
    await waitOpen();

    // 默认 gap.offset = 6 ⇒ 挖洞外扩 6
    expect(holeXY()).toEqual({ x: '94', y: '194' });

    // 异步布局把目标推走（例如上方图片加载完成）—— 不触发 resize / scroll
    t.rect.x = 300;
    t.rect.y = 400;
    await nextTick();
    await nextTick();

    // 上游同款：不重算（因此**不要**为此加 ResizeObserver / 轮询）
    expect(holeXY()).toEqual({ x: '94', y: '194' });

    w.unmount();
    t.restore();
  });

  it('[B] 触发集生效：window scroll / resize 后立刻重算（回归）', async () => {
    const t = makeMutableTarget({ x: 100, y: 200, width: 100, height: 50 });
    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        steps: [{ title: 'T', description: '', target: () => t.el }],
      },
    });
    await waitOpen();
    expect(holeXY()).toEqual({ x: '94', y: '194' });

    t.rect.x = 300;
    t.rect.y = 400;

    window.dispatchEvent(new Event('scroll'));
    await nextTick();
    expect(holeXY()).toEqual({ x: '294', y: '394' });

    t.rect.x = 10;
    t.rect.y = 20;
    window.dispatchEvent(new Event('resize'));
    await nextTick();
    expect(holeXY()).toEqual({ x: '4', y: '14' });

    w.unmount();
    t.restore();
  });

  it('[C] 触发集生效：切 step（target 变化）后立刻重算（回归）', async () => {
    const a = makeMutableTarget({ x: 100, y: 200, width: 100, height: 50 });
    const b = makeMutableTarget({ x: 400, y: 500, width: 20, height: 20 });
    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: {
        open: true,
        current: 0,
        steps: [
          { title: 'A', description: '', target: () => a.el },
          { title: 'B', description: '', target: () => b.el },
        ],
      },
    });
    await waitOpen();
    expect(holeXY()).toEqual({ x: '94', y: '194' });

    await w.setProps({ current: 1 });
    await nextTick();
    await nextTick();
    expect(holeXY()).toEqual({ x: '394', y: '494' });

    w.unmount();
    a.restore();
    b.restore();
  });
});
