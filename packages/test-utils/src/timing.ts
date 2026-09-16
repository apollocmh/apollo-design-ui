/**
 * 确定性等待。
 *
 * ── 为什么没有 `sleep`（对照上游 `tests/utils.tsx`）─────────────────────────────
 * 上游导出了 `sleep(timeout = 0)`，并在 `focusTest` / `waitFakeTimer` 里使用。
 * `TESTING.md` 反模式 **A3** 明文禁止 `await sleep(n)`：不确定、慢、易 flaky。
 *
 * 本模块**不导出任何接收毫秒数的函数** —— 一旦接收毫秒，`sleep` 就会立刻回来。
 * 等待只能表达成两种**语义**等待：
 *
 *   flushAll()      冲刷 Vue 调度器 + 微任务队列。不碰定时器。
 *   waitFrames(n)   等 n 个动画帧。
 *
 * ── 与上游 `waitFakeTimer` 的关系 ──────────────────────────────────────────────
 * 上游的 `waitFakeTimer(advanceTime = 1000, times = 20)` 是为了「推进 20 次 × 1000ms，
 * 把浮层动画跑完」。我们不需要它，因为**测试环境整体禁用了 motion**
 * （`vitest.setup.ts` 把 `defaultMotionConfig` 改成 `{ motion: false }`，见 `TESTING.md` T6）——
 * 单元层根本不存在「等动画结束」这件事。动画的最终状态由 L6 在真实浏览器里验证。
 */

import { flushPromises } from '@vue/test-utils';
import { vi } from 'vitest';
import { nextTick } from 'vue';

/**
 * 一帧的毫秒预算。
 *
 * 只在**假定时器**下使用（真定时器下由浏览器的帧调度决定，不需要我们猜）。
 * 16ms ≈ 60fps，与 `vitest.setup.ts` 里 `requestAnimationFrame` 的 `setTimeout(…, 0)` 兜底
 * 语义不冲突：那个兜底是「宏任务排队」，这里是「推进时间轴」。
 */
const FRAME_MS = 16;

/**
 * 冲刷「已排队的宏任务 + 微任务」。
 *
 * ── 为什么不能直接 `await flushPromises()`（实测结论）──────────────────────────
 * `@vue/test-utils` 的 `flushPromises` 实现是：
 *
 *     const scheduler = typeof setImmediate === 'function' ? setImmediate : setTimeout;
 *     return new Promise(resolve => { scheduler(resolve, 0); });
 *
 * 而 `vi.useFakeTimers()` 在不传 `toFake` 时**默认伪造全部 timer**，`setImmediate` 在其中。
 * 于是那个 `scheduler(resolve, 0)` 排进假队列后永远不执行 —— **直接死等**。
 *
 * 实测（`packages/test-utils/src/__tests__/timing.test.ts`）：
 *
 *     假定时器下 flushPromises().then(...) 是否已 resolve
 *       · 不推进时间                → false   ← 死等
 *       · vi.advanceTimersByTime(0) → false   ← 同步推进也不 flush 微任务链
 *       · vi.advanceTimersByTimeAsync(0) → true   ✅
 *
 * 所以这里必须分流。`advanceTimersByTimeAsync` 是异步版本：推进到期定时器之后
 * 会 `await` 一轮微任务队列，语义与真定时器下的 `flushPromises` 对齐。
 *
 * ⚠️ 它**只**执行到期时间为 0 的定时器，不推进时间轴。
 * 要等「若干帧」请用 `waitFrames`，要等「某个具体延迟」请在用例里显式 `advanceTimersByTime`。
 */
async function flushScheduledQueue(): Promise<void> {
  if (vi.isFakeTimers()) {
    await vi.advanceTimersByTimeAsync(0);
    return;
  }
  await flushPromises();
}

/**
 * 冲刷 Vue 的调度器与微任务队列。
 *
 * 三次等待缺一不可：
 *   1. `nextTick()`            —— 冲刷 Vue 的 job 队列（组件更新、`flush: 'pre'` watcher）
 *   2. `flushScheduledQueue()` —— 冲刷已排队的 Promise 回调（异步校验、动态 import）
 *   3. `nextTick()`            —— 第 2 步的回调可能又触发了响应式更新，再冲一次
 *
 * ⚠️ 它**不**推进时间轴。要等动画帧请用 `waitFrames`，要等具体延迟请显式 `advanceTimersByTime`。
 */
export async function flushAll(): Promise<void> {
  await nextTick();
  await flushScheduledQueue();
  await nextTick();
}

/**
 * 等待 `count` 个动画帧，每帧之后冲刷调度器。
 *
 * 两种运行模式下语义一致：
 *   - **真定时器**：`await` 一次 `requestAnimationFrame` 回调（jsdom 下约 16ms/帧）
 *   - **假定时器**：`await vi.advanceTimersByTimeAsync(FRAME_MS)`
 *
 * 后者是必须的：实测 `vi.useFakeTimers()` 会**伪造 `requestAnimationFrame`**
 * （推进 20ms 后回调确实触发，见 `timing.test.ts`），但不推进时间就永远不回调 ——
 * 直接 `await` 一个 rAF 会**死等**。这正是上游 `sleep` 在假定时器下会挂住的原因。
 *
 * @param count 帧数。默认 2 —— 一帧常常不够：第一帧提交 DOM，第二帧才完成布局相关读取。
 */
export async function waitFrames(count = 2): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    if (vi.isFakeTimers()) {
      await vi.advanceTimersByTimeAsync(FRAME_MS);
    } else {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    }
    await flushAll();
  }
}
