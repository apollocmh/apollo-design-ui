/**
 * `@rc-component/mentions@1.12.0` 的 `es/hooks/useEffectState.js`（21 行）—— 本仓等价物。
 *
 * 上游语义：`update(cb)` 把 `cb` 存进 state 并**递增一个 id** ⇒ 触发一次 effect ⇒
 * **在渲染提交之后**调用 `cb`。用途只有一个：`stopMeasure` 之后要把光标设回新位置，
 * 而那时 DOM 里的 `textarea.value` 必须**已经是新值**。
 *
 * ── 为什么不用 `nextTick` 直接了事 ─────────────────────────────────────────────
 *
 * `nextTick` 在「同一批状态变更」下的时机是对的，但它**不会**等组件的 `flush: 'post'`
 * 回调。本仓用 `watch(..., { flush: 'post' })`：post 队列排在组件 DOM patch 之后
 * ⇒ 语义与 React 的 `useEffect`（被动 effect，commit 后）一致。
 *
 * ⚠️ 必须在组件的 `setup` 同步阶段调用（`watch` 需要活跃的 effect scope）。
 */

import { ref, watch } from 'vue';

interface EffectState {
  id: number;
  callback: (() => void) | null;
}

/**
 * 返回一个 `update(callback)`：调用它会在**下一次 DOM 更新之后**执行 `callback`。
 *
 * 连续多次调用只保留**最后一次**（与上游的 `setEffectId` 覆盖语义一致）。
 */
export function useEffectState(): (callback: () => void) => void {
  const state = ref<EffectState>({ id: 0, callback: null });

  watch(
    state,
    (next) => {
      next.callback?.();
    },
    { flush: 'post' },
  );

  return (callback: () => void) => {
    state.value = { id: state.value.id + 1, callback };
  };
}
