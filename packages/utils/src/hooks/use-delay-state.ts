/**
 * `useDelayState` —— 像 `useState`，但**默认在下一帧才更新**。
 *
 * 契约来源：`@rc-component/util/hooks/useDelayState`
 * （antd 的 `button` / `form` / `slider` / `typography` / `upload` 使用）。
 *
 * 为什么要"延迟到下一帧"：这些组件会在高频事件（输入、拖拽、测量）里更新状态。
 * 同步更新会在同一帧内触发多次渲染，而**待执行的更新总是被最新值替换**（不排队），
 * 所以最终只会渲染一次。这是性能优化，不是行为妥协 —— 最终状态与同步更新一致。
 *
 * API：
 *   `const [value, setValue] = useDelayState(initial)`
 *   `setValue(next)`                     → 下一帧（1 帧）更新
 *   `setValue(next, true)`               → **立即**更新
 *   `setValue(next, { frame: 2 })`       → 2 帧后更新
 *   `setValue(next, { ms: 100 })`        → 100ms 后更新
 *   `next` 可以是 `(prev) => next`
 *
 * 每次调用都会先取消上一个待执行更新。
 *
 * ⚠️ 实现上刻意**不用** `watchEffect` / `nextTick`：
 *    它们对齐的是微任务，而这里需要的是**帧**对齐（与 rAF 一致），
 *    否则在 `requestAnimationFrame` 驱动的场景（拖拽、动画）下时序会错。
 */

import { getCurrentScope, onScopeDispose, type Ref, ref } from 'vue';
import raf from '../raf';

export type DelayConfig = { frame: number; ms?: never } | { frame?: never; ms: number };

export type SetDelayState<T> = (
  nextValue: T | ((prevValue: T) => T),
  /** `true` 立即更新；不传则延迟一帧。 */
  immediatelyOrDelay?: boolean | DelayConfig,
) => void;

export function useDelayState<T>(defaultValue: T | (() => T)): [Ref<T>, SetDelayState<T>] {
  const value = ref(
    typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue,
  ) as Ref<T>;

  /** 待执行的调度：`[是否为 rAF, 取消句柄]`。`null` 表示没有待执行更新。 */
  let pending: [isRaf: boolean, handle: number] | null = null;

  function cancelPending(): void {
    if (!pending) return;
    const [isRaf, handle] = pending;
    if (isRaf) {
      raf.cancel(handle);
    } else {
      clearTimeout(handle);
    }
    pending = null;
  }

  const setDelayState: SetDelayState<T> = (nextValue, immediatelyOrDelay) => {
    const apply = (): void => {
      value.value =
        typeof nextValue === 'function' ? (nextValue as (prev: T) => T)(value.value) : nextValue;
    };

    // 无论走哪条路都先取消上一个 —— 这是"pending 被最新值替换"的实现点
    cancelPending();

    if (immediatelyOrDelay === true) {
      apply();
      return;
    }

    const delayConfig: DelayConfig = (immediatelyOrDelay as DelayConfig | undefined) ?? {
      frame: 1,
    };

    if ('ms' in delayConfig) {
      pending = [false, setTimeout(apply, delayConfig.ms) as unknown as number];
      return;
    }

    pending = [true, raf(apply, delayConfig.frame)];
  };

  // 组件卸载/作用域销毁时取消待执行更新，避免对已销毁的 ref 赋值。
  // 守卫 getCurrentScope：允许在组件外（如 headless composable 的单测）使用而不告警。
  if (getCurrentScope()) {
    onScopeDispose(cancelPending);
  }

  return [value, setDelayState];
}

export default useDelayState;
