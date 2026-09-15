/**
 * `useUpdateEffect` —— 只在**依赖变化**时执行的副作用（首次挂载不执行）。
 *
 * 契约来源：`@rc-component/util/hooks/useLayoutEffect` 的 `useLayoutUpdateEffect`
 * （antd 的 `button` / `color-picker` / `form` / `grid` / `masonry` / `spin` / `splitter` / `typography` 使用）。
 *
 * Vue 映射（依据：docs/foundation/rc-util-contract.md §3.3）：
 *
 *   React: useLayoutEffect(cb, deps) + 首帧标记
 *   Vue:   watch(deps, cb, { flush: 'post' })
 *
 * 为什么是 `flush: 'post'` 而不是默认的 `pre`：
 *   React 的布局副作用在 **DOM 变更之后、绘制之前** 执行；antd 用它测量 DOM。
 *   Vue 默认的 `flush: 'pre'` 在 DOM 更新**之前**执行，测量会拿到旧值。
 *   `'post'` 才是"DOM 已更新"的时机。
 *
 * ⚠️ 已知顺序差异（登记在文档中，无法消除）：
 *   React 的布局副作用是**逐组件**在提交阶段同步执行的；
 *   Vue 的 `flush: 'post'` 是同一批更新里**所有组件**更新完之后按注册顺序执行。
 *   对「测量自己的 DOM」这类用法无影响；但**不要**写依赖"我在别人之前测量"的逻辑。
 *
 * `deps` 的形态：React 的 deps 是任意值数组，Vue 的 `watch` 需要 getter 或响应式源。
 * 这里统一接受 `WatchSource`，所以传 `() => props.value`、`props.value`（响应式对象）或 `someRef` 都可以。
 */

import { getCurrentScope, onScopeDispose, type WatchSource, watch } from 'vue';

export type UpdateEffectDeps = readonly WatchSource<unknown>[];

/**
 * 回调可以返回一个清理函数。
 *
 * ⚠️ 这里**必须**是 `void | Cleanup`，不能写成 `undefined | Cleanup`。
 * 已用 `tsc --strict` 实测：TS 会把 `() => {}` 推断为 `() => void`，
 * 而 `void` 不可赋值给 `undefined`，于是改成 undefined 之后连最简单的空回调都会被拒绝
 * （`Type 'void' is not assignable to 'Cleanup | undefined'`）。与 React 的 `EffectCallback` 同款。
 */
// biome-ignore lint/suspicious/noConfusingVoidType: void 在此有承载作用，改成 undefined 会破坏公开 API（见上方注释的实测结论）
type UpdateEffectCallback = () => void | (() => void);

/**
 * @param callback 依赖变化时执行。返回值作为清理函数，在**下次执行前**与**作用域销毁时**调用。
 * @param deps 依赖数组。传空数组等价于"永不执行"。
 */
export function useUpdateEffect(callback: UpdateEffectCallback, deps: UpdateEffectDeps): void {
  // `callback()` 的返回类型含 void，而 void 不可赋值给 undefined ——
  // 改成 `(() => void) | undefined` 会在 `cleanup = callback()` 处直接报 TS2322。
  // biome-ignore lint/suspicious/noConfusingVoidType: void 在此必需（见上两行，已用 tsc --strict 实测）
  let cleanup: void | (() => void);

  const run = (): void => {
    if (typeof cleanup === 'function') {
      cleanup();
    }
    cleanup = callback();
  };

  // immediate 默认 false —— 这正是"首次挂载不执行"的语义，不需要额外的首帧标记。
  watch(deps, run, { flush: 'post' });

  if (getCurrentScope()) {
    onScopeDispose(() => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
      cleanup = undefined;
    });
  }
}

export default useUpdateEffect;
