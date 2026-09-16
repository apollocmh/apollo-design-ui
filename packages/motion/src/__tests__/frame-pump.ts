/**
 * 共享桩替：帧泵 + 假 DOM 适配器 + 微任务冲刷。
 *
 * 为什么自己造而不用 `vi.useFakeTimers()`：
 *   假定时器默认伪造**全部** timer，于是 `flushPromises()` 不推进时间就死等；
 *   而 `prepare` 返回 Promise 的路径恰恰需要「帧 + 微任务」混合推进。
 *   把「第几帧」变成显式输入，时间线才能被逐帧断言
 *   （`motion-contract.md` §8 P1，选方案 A）。
 *
 * 被 `driver.test.ts`（驱动本身）与 `use-motion-status.test.ts`（Vue 接线）共用 ——
 * T2：同一份时间语义不该有两套实现。
 */

import type { MotionScheduler } from '../index';

export interface FramePump {
  scheduler: MotionScheduler;
  /** 推进一帧 */
  tick(): void;
  /** 推进 n 帧 */
  tickFrames(n: number): void;
  /** 触发所有未取消的 deadline 定时器 */
  fireDeadline(): void;
  deadlineCount(): number;
}

export function createFramePump(): FramePump {
  interface Task {
    remaining: number;
    cb: () => void;
    cancelled: boolean;
    done: boolean;
  }
  let tasks: Task[] = [];
  const deadlines: { cb: () => void; cancelled: boolean; fired: boolean }[] = [];

  const tick = (): void => {
    const current = tasks.filter((t) => !t.cancelled && !t.done);
    for (const t of current) {
      t.remaining -= 1;
      if (t.remaining <= 0) {
        t.done = true;
        t.cb();
      }
    }
    tasks = tasks.filter((t) => !t.cancelled && !t.done);
  };

  return {
    scheduler: {
      nextFrame(cb) {
        // ⭐ 2 而不是 1：rc-motion 的 `useNextFrame` 是双 rAF（`delay = 2`）。
        //    改成 1 会让 driver.test.ts 的「每两步隔两帧」用例失败 —— 那是故意的。
        const task: Task = { remaining: 2, cb, cancelled: false, done: false };
        tasks.push(task);
        return () => {
          task.cancelled = true;
        };
      },
      setDeadline(cb) {
        const d = { cb, cancelled: false, fired: false };
        deadlines.push(d);
        return () => {
          d.cancelled = true;
        };
      },
      tick,
    },
    tick,
    tickFrames(n) {
      for (let i = 0; i < n; i += 1) tick();
    },
    fireDeadline() {
      for (const d of deadlines) {
        if (!d.cancelled && !d.fired) {
          d.fired = true;
          d.cb();
        }
      }
    },
    deadlineCount() {
      return deadlines.filter((d) => !d.cancelled).length;
    },
  };
}

/** 微任务 + 宏任务各冲一轮，覆盖 `Promise.resolve(result).then(...)` 的路径 */
export async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
