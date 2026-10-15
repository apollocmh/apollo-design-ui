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
import { MockResizeObserver } from '../../../../../vitest.setup';
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

/** 触发所有已注册的 ResizeObserver（模拟「目标自身或祖先尺寸真的变了」）。 */
function triggerResize(): void {
  for (const observer of MockResizeObserver.instances) {
    observer.trigger();
  }
}

/** 位置更新经 rAF 合并，等它落地。 */
async function waitHole(x: string, y: string): Promise<void> {
  await vi.waitUntil(() => holeXY().x === x && holeXY().y === y, { timeout: 2000 });
}

/**
 * `observeResize` 用的是**全局单例** ResizeObserver，所以「谁被观察」要看
 * 各实例 `targets` 的总和。用**相对**断言（挂载前后 / 卸载前后）避免受其它用例影响。
 */
const observedCount = (): number =>
  [...MockResizeObserver.instances].reduce((n, o) => n + o.targets.size, 0);

const isObserved = (el: Element): boolean =>
  [...MockResizeObserver.instances].some((o) => o.targets.has(el));

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
  it('[A] 异步内容把目标推走 ⇒ 尺寸信号到达后**重定位**（Issue #53 修复）', async () => {
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

    // 关键分岔：上游（rc useTarget）到此为止 —— 没有 RO，浮层与遮罩停在旧位置。
    // 本仓用 ResizeObserver 覆盖这类异步布局：先确认「没有信号时不重算」仍是事实…
    expect(holeXY()).toEqual({ x: '94', y: '194' });

    // …再确认「尺寸信号到达后」会重算（这才是修复点）。
    triggerResize();
    await waitHole('294', '394');

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

    // 真实浏览器里文档滚动派发到 document；capture 监听同样收得到
    document.dispatchEvent(new Event('scroll'));
    await waitHole('294', '394');

    t.rect.x = 10;
    t.rect.y = 20;
    window.dispatchEvent(new Event('resize'));
    await waitHole('4', '14');

    w.unmount();
    t.restore();
  });

  it('[B2] 目标在**滚动容器内**滚动 ⇒ 也重算（capture 阶段监听，上游收不到）', async () => {
    const t = makeMutableTarget({ x: 100, y: 200, width: 100, height: 50 });
    // 造一个滚动祖先，把目标塞进去
    const scroller = document.createElement('div');
    scroller.appendChild(t.el);
    document.body.appendChild(scroller);

    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { open: true, steps: [{ title: 'T', description: '', target: () => t.el }] },
    });
    await waitOpen();
    expect(holeXY()).toEqual({ x: '94', y: '194' });

    t.rect.x = 260;
    t.rect.y = 360;
    // scroll **不冒泡** ⇒ 在元素上派发，只有 capture 阶段能收到
    scroller.dispatchEvent(new Event('scroll'));
    await waitHole('254', '354');

    w.unmount();
    t.restore();
    scroller.remove();
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

  // ==================== 观察器的生命周期（注册 / 注销 / 无残留）====================

  it('[D] 关闭 ⇒ 注销观察；卸载 ⇒ 观察器清零（不残留、不泄漏）', async () => {
    const before = observedCount();
    const t = makeMutableTarget({ x: 100, y: 200, width: 100, height: 50 });

    const w = mount(Tour, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { open: true, steps: [{ title: 'T', description: '', target: () => t.el }] },
    });
    await waitOpen();

    // 目标自身 + 祖先链（body 等）都被观察
    const whileOpen = observedCount();
    expect(whileOpen).toBeGreaterThan(before);

    // 关闭 ⇒ 立即停止观察（不是等卸载）
    await w.setProps({ open: false });
    await nextTick();
    expect(observedCount()).toBeLessThan(whileOpen);

    // 卸载 ⇒ 回到基线，零残留
    w.unmount();
    await nextTick();
    expect(observedCount()).toBe(before);

    t.restore();
  });

  it('[E] 切 step ⇒ 重新观察**新的**目标（旧目标不再被观察）', async () => {
    const before = observedCount();
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
    expect(isObserved(a.el)).toBe(true);
    expect(isObserved(b.el)).toBe(false);

    await w.setProps({ current: 1 });
    await nextTick();
    await nextTick();
    expect(isObserved(a.el)).toBe(false);
    expect(isObserved(b.el)).toBe(true);

    w.unmount();
    expect(observedCount()).toBe(before);
    a.restore();
    b.restore();
  });
});
