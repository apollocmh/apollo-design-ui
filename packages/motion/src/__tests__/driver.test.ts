/**
 * L2 交互测试 —— `driver.ts`（AR2 的帧驱动外壳）。
 *
 * 状态机**内核**由 `motion.test.ts` 的差分证明；这里证明的是另一半：
 * **步进发生在正确的时机**。antd 的每一步之间是**双 rAF**
 * （`useNextFrame.js` 的 `delay = 2`），少一帧 CSS 动画就不会从初始态开始。
 *
 * 为什么自己造帧泵而不用 `vi.useFakeTimers()`：
 *   假定时器默认伪造**全部** timer，于是 `flushPromises()` 不推进时间就死等；
 *   而 `prepare` 返回 Promise 的路径恰恰需要「帧 + 微任务」混合推进。
 *   把「第几帧」变成显式输入，时间线才能被逐帧断言。
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { MotionDriver, MotionSnapshot } from '../index';
import { createMotionDriver, defaultScheduler, getMotionClassName } from '../index';
import type { FramePump } from './frame-pump';
import { createFramePump, flush } from './frame-pump';

interface Rig {
  driver: MotionDriver;
  pump: FramePump;
  snapshots: MotionSnapshot[];
  attached: Element[];
  detached: Element[];
  element: Element;
}

function createRig(options: Partial<Parameters<typeof createMotionDriver>[0]> = {}): Rig {
  const pump = createFramePump();
  const element = document.createElement('div');
  document.body.appendChild(element);

  const snapshots: MotionSnapshot[] = [];
  const attached: Element[] = [];
  const detached: Element[] = [];

  const driver = createMotionDriver({
    supportMotion: true,
    getElement: () => element,
    scheduler: pump.scheduler,
    dom: {
      attach: (el) => attached.push(el),
      detach: (el) => detached.push(el),
    },
    onChange: (s) => snapshots.push(s),
    ...options,
  });

  return { driver, pump, snapshots, attached, detached, element };
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------

describe('首帧', () => {
  it('mount 之前 styleReady 是 "NONE" —— 支持动画且开了 appear 时首帧不渲染', () => {
    const rig = createRig();
    expect(rig.driver.getSnapshot().styleReady).toBe('NONE');
  });

  it('关掉 appear 就不拦首帧', () => {
    const rig = createRig({ motionAppear: false });
    expect(rig.driver.getSnapshot().styleReady).toBe(true);
  });

  it('不支持动画时也不拦首帧', () => {
    const rig = createRig({ supportMotion: false });
    expect(rig.driver.getSnapshot().styleReady).toBe(true);
  });
});

describe('enter 的完整时间线', () => {
  it('每两步之间隔**两帧**，且 class 序列与 antd 一致', async () => {
    const rig = createRig({ motionAppear: false });
    const { driver } = rig;

    driver.mount(true);
    await flush();

    // 无 prepare handler ⇒ prepare 被 SkipStep，同步落到 start（不占帧）
    expect(driver.getSnapshot().status).toBe('none'); // mounted=false ⇒ 不是 enter
    // ⚠️ 首次 mount 时 mounted=false，按 antd 的规则走的是 **appear** 而不是 enter。
    //    上面把 motionAppear 关了，于是 nextStatus 为空 ⇒ 不动。

    const rig2 = createRig();
    rig2.driver.mount(true);
    await flush();
    expect(rig2.driver.getSnapshot().status).toBe('appear');
    expect(rig2.driver.getSnapshot().step).toBe('start');
    expect(getMotionClassName('ant-zoom', 'appear', 'start')).toBe(
      'ant-zoom-appear ant-zoom-appear-start ant-zoom',
    );

    // start → active：两帧
    rig2.pump.tickFrames(2);
    await flush();
    expect(rig2.driver.getSnapshot().step).toBe('active');

    // active → end：再两帧
    rig2.pump.tickFrames(2);
    await flush();
    expect(rig2.driver.getSnapshot().step).toBe('end');

    // end 步不再前进 —— 要等 DOM 事件
    rig2.pump.tickFrames(4);
    await flush();
    expect(rig2.driver.getSnapshot().step).toBe('end');
    expect(rig2.driver.getSnapshot().status).toBe('appear');
  });

  it('DOM 结束事件一到就收尾：status 回 none，样式清空', async () => {
    const rig = createRig();
    rig.driver.mount(true);
    await flush();
    rig.pump.tickFrames(4);
    await flush();
    expect(rig.driver.getSnapshot().step).toBe('end');

    rig.driver.notifyEnd({ target: rig.element });
    expect(rig.driver.getSnapshot().status).toBe('none');
    expect(rig.driver.getSnapshot().style).toBeNull();
  });

  it('⭐ 只认本元素的事件 —— 子元素冒泡上来的被忽略', async () => {
    const rig = createRig();
    rig.driver.mount(true);
    await flush();
    rig.pump.tickFrames(4);
    await flush();

    rig.driver.notifyEnd({ target: 'some-child' });
    expect(rig.driver.getSnapshot().status).toBe('appear'); // 没收尾

    rig.driver.notifyEnd({ target: rig.element });
    expect(rig.driver.getSnapshot().status).toBe('none');
  });

  it('事件监听只在进入 active 步时挂上', async () => {
    const rig = createRig();
    rig.driver.mount(true);
    await flush();
    expect(rig.attached).toHaveLength(0);

    rig.pump.tickFrames(2);
    await flush();
    expect(rig.driver.getSnapshot().step).toBe('active');
    expect(rig.attached).toEqual([rig.element]);
  });
});

describe('motionDeadline', () => {
  it('进入 active 时挂上兜底定时器', async () => {
    const rig = createRig({ motionDeadline: 500 });
    rig.driver.mount(true);
    await flush();
    expect(rig.pump.deadlineCount()).toBe(0);

    rig.pump.tickFrames(2);
    await flush();
    expect(rig.driver.getSnapshot().step).toBe('active');
    expect(rig.pump.deadlineCount()).toBe(1);
  });

  it('deadline 触发会收尾 —— 不看 target', async () => {
    const rig = createRig({ motionDeadline: 500 });
    rig.driver.mount(true);
    await flush();
    rig.pump.tickFrames(2);
    await flush();

    rig.pump.fireDeadline();
    expect(rig.driver.getSnapshot().status).toBe('none');
  });

  it('正常结束时清掉兜底定时器 —— 不留悬挂 timer', async () => {
    const rig = createRig({ motionDeadline: 500 });
    rig.driver.mount(true);
    await flush();
    rig.pump.tickFrames(2);
    await flush();
    expect(rig.pump.deadlineCount()).toBe(1);

    rig.driver.notifyEnd({ target: rig.element });
    // 收尾后 deadline 已被取消
    expect(rig.pump.deadlineCount()).toBe(0);
  });
});

describe('不支持动画 / prepare 步', () => {
  it('不支持动画且无 prepare handler ⇒ 根本不启动', async () => {
    const rig = createRig({ supportMotion: false });
    rig.driver.mount(true);
    await flush();
    expect(rig.driver.getSnapshot().status).toBe('none');
    expect(rig.driver.getSnapshot().step).toBe('none');
  });

  it('⭐ 不支持动画**但**有 prepare ⇒ 仍然走简队列并自行收尾', async () => {
    const prepared: string[] = [];
    const rig = createRig({
      supportMotion: false,
      hooks: {
        onAppearPrepare: () => {
          prepared.push('prepare');
        },
      },
    });
    rig.driver.mount(true);
    await flush();
    expect(prepared).toEqual(['prepare']);
    expect(rig.driver.getSnapshot().status).toBe('appear');
    expect(rig.driver.getSnapshot().step).toBe('prepare');

    // prepare → prepared（两帧）
    rig.pump.tickFrames(2);
    await flush();
    // prepared 一到就收尾（useStatus.js:134-136），不需要任何 DOM 事件
    expect(rig.driver.getSnapshot().status).toBe('none');
  });

  it('prepare 返回 Promise 时，步进要等它 resolve', async () => {
    // ⚠️ 不能写成 `let resolvePrepare: (() => void) | null = null`：
    //    赋值发生在 Promise 的回调里，TS 的控制流分析认不出来，
    //    用的时候会把它窄化成 null（于是 `?.()` 报 "Type 'never' has no call signatures"）。
    //    挂在一个对象属性上就没这个问题。
    const gate: { resolve?: () => void } = {};
    const order: string[] = [];
    const rig = createRig({
      hooks: {
        onAppearPrepare: () => {
          order.push('prepare');
          return new Promise<void>((r) => {
            gate.resolve = r;
          });
        },
        onAppearStart: () => {
          order.push('start');
          return { height: 0 };
        },
      },
    });

    rig.driver.mount(true);
    await flush();
    expect(order).toEqual(['prepare']);
    expect(rig.driver.getSnapshot().step).toBe('prepare');

    // 帧走完了，但 Promise 还没 resolve ⇒ 停在 prepare
    rig.pump.tickFrames(4);
    await flush();
    expect(rig.driver.getSnapshot().step).toBe('prepare');

    gate.resolve?.();
    await flush();
    expect(order).toEqual(['prepare', 'start']);
    expect(rig.driver.getSnapshot().step).toBe('start');
  });

  it('⭐ 有 prepare handler 时 start 步注入 transition:none', async () => {
    const rig = createRig({
      hooks: {
        onAppearPrepare: () => undefined,
        onAppearStart: () => ({ height: 0, opacity: 0 }),
      },
    });
    rig.driver.mount(true);
    await flush();
    // prepare → start 需要两帧；**只**推两帧，否则会滑到 active 就看不到 transition:none 了
    rig.pump.tickFrames(2);
    await flush();

    const snap = rig.driver.getSnapshot();
    expect(snap.step).toBe('start');
    expect(snap.style).toEqual({ transition: 'none', height: 0, opacity: 0 });

    // ⭐ 只断言 `getSnapshot()` 是不够的 —— 那个是「现在读」，绕过了通知。
    //    必须断言**这一帧被 emit 过**：antd 里 `setStyle(...)` 是 setState，
    //    天然触发渲染；我们的 handlerStyle 是闭包变量，不 emit 就永远不上屏
    //    （表现为 collapse 从自然高度直接跳到终态，中间没有过渡）。
    expect(rig.snapshots.some((s) => s.step === 'start' && (s.style?.height as number) === 0)).toBe(
      true,
    );
  });
});

describe('onXxxEnd 可否决结束', () => {
  it('返回 false 时动画不结束', async () => {
    const rig = createRig({
      hooks: { onAppearEnd: () => false },
    });
    rig.driver.mount(true);
    await flush();
    rig.pump.tickFrames(4);
    await flush();

    rig.driver.notifyEnd({ target: rig.element });
    expect(rig.driver.getSnapshot().status).toBe('appear');
  });
});

describe('离场', () => {
  it('setVisible(false) 走 leave，且 mergedVisible 在动画期间保持 true', async () => {
    const rig = createRig({ motionAppear: false });
    rig.driver.mount(true);
    await flush();
    rig.driver.notifyEnd({ target: rig.element });
    expect(rig.driver.getSnapshot().status).toBe('none');

    rig.driver.setVisible(false);
    await flush();
    expect(rig.driver.getSnapshot().status).toBe('leave');
    // ⚠️ 离场动画期间元素**必须还在** —— mergedVisible 仍是 true
    expect(rig.driver.getSnapshot().mergedVisible).toBe(false);
    expect(rig.driver.getSnapshot().rendered).toBe(true);
  });
});

describe('defaultScheduler 的双 rAF', () => {
  /**
   * 「两帧」这条性质住在 `defaultScheduler` 里（帧泵是测试替身，它自己说自己是两帧不算数）。
   * 所以这里拦截全局 rAF 直接验证生产实现 —— 少一帧 CSS 动画就不会从初始态开始。
   */
  it('nextFrame 要两次 rAF 才回调', () => {
    const original = globalThis.requestAnimationFrame;
    const originalCancel = globalThis.cancelAnimationFrame;
    const queue: FrameRequestCallback[] = [];

    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      queue.push(cb);
      return queue.length;
    }) as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame = (() => {}) as typeof globalThis.cancelAnimationFrame;

    try {
      let called = 0;
      defaultScheduler.nextFrame(() => {
        called += 1;
      });

      // 第一次 rAF：只安排了内层，回调还没跑
      const first = queue.shift();
      expect(first).toBeTypeOf('function');
      first?.(0);
      expect(called).toBe(0);

      // 第二次 rAF：回调才执行
      const second = queue.shift();
      expect(second).toBeTypeOf('function');
      second?.(0);
      expect(called).toBe(1);
    } finally {
      globalThis.requestAnimationFrame = original;
      globalThis.cancelAnimationFrame = originalCancel;
    }
  });

  it('取消后不再回调', () => {
    const original = globalThis.requestAnimationFrame;
    const originalCancel = globalThis.cancelAnimationFrame;
    const queue: FrameRequestCallback[] = [];

    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      queue.push(cb);
      return queue.length;
    }) as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame = (() => {}) as typeof globalThis.cancelAnimationFrame;

    try {
      let called = 0;
      const cancel = defaultScheduler.nextFrame(() => {
        called += 1;
      });
      cancel();
      // 用 for-of 而不是 `splice(0).forEach(...)`：后者返回 undefined 却被当语句用，
      // 会触发 useIterableCallbackReturn；这里确实不需要返回值，for-of 更直白。
      for (const cb of queue.splice(0)) {
        cb(0);
      }
      expect(called).toBe(0);
    } finally {
      globalThis.requestAnimationFrame = original;
      globalThis.cancelAnimationFrame = originalCancel;
    }
  });
});

describe('清理', () => {
  it('destroy 后不再有帧或定时器在跑', async () => {
    const rig = createRig({ motionDeadline: 500 });
    rig.driver.mount(true);
    await flush();
    rig.pump.tickFrames(2);
    await flush();

    rig.driver.destroy();
    const before = rig.driver.getSnapshot().step;
    rig.pump.tickFrames(4);
    await flush();
    expect(rig.driver.getSnapshot().step).toBe(before);
  });
});
