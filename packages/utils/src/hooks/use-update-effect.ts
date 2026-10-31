/**
 * Watch reactive sources after Vue has updated the DOM, without running on mount.
 * The callback's cleanup runs before the next callback and on scope disposal.
 * This is a Vue watch wrapper, not a React lifecycle emulator. Keep its exported
 * name for existing callers. Historical analysis: docs/foundation/rc-util-contract.md.
 * Sources must be refs or getters; pass () => props.value rather than a setup snapshot.
 */

import { type WatchSource, watch } from 'vue';

export type UpdateEffectDeps = readonly WatchSource<unknown>[];

/**
 * 回调可以返回一个清理函数。
 *
 * ⚠️ 这里**必须**是 `void | Cleanup`，不能写成 `undefined | Cleanup`。
 * 已用 `tsc --strict` 实测：TS 会把 `() => {}` 推断为 `() => void`，
 * 而 `void` 不可赋值给 `undefined`，于是改成 undefined 之后连最简单的空回调都会被拒绝
 * （`Type 'void' is not assignable to 'Cleanup | undefined'`）。
 */
// biome-ignore lint/suspicious/noConfusingVoidType: void 在此有承载作用，改成 undefined 会破坏公开 API（见上方注释的实测结论）
type UpdateEffectCallback = () => void | (() => void);

/**
 * @param callback 依赖变化时执行。返回值作为清理函数，在**下次执行前**与**作用域销毁时**调用。
 * @param deps 依赖数组。传空数组等价于"永不执行"。
 */
export function useUpdateEffect(callback: UpdateEffectCallback, deps: UpdateEffectDeps): void {
  watch(
    deps,
    (_values, _previous, onCleanup) => {
      const cleanup = callback();
      if (typeof cleanup === 'function') onCleanup(cleanup);
    },
    { flush: 'post' },
  );
}

export default useUpdateEffect;
