/**
 * `useMergedConfig` —— 把「布尔开关 / 配置对象」统一成 `[是否启用, 配置]`。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/hooks/useMergedConfig.js`（**逐条对齐**）：
 *
 * ```js
 * const useMergedConfig = (propConfig, templateConfig) => {
 *   const support = Boolean(propConfig);
 *   return React.useMemo(() => {
 *     const config = {
 *       ...templateConfig,
 *       ...(support && isPlainObject(propConfig) ? propConfig : null),
 *     };
 *     return [support, config];
 *   }, [support, propConfig, templateConfig]);
 * };
 * ```
 *
 * Typography 里三处用它：`editable` / `copyable` / `ellipsis`。判据的两条细节：
 *
 *   1. **`support` 是 `Boolean(propConfig)`** —— 传 `{}`（空对象）也算启用。
 *   2. **展开 `propConfig` 的条件是 `support && isPlainObject(propConfig)`**，
 *      而 `isPlainObject` 是 antd 的**宽松**语义（数组也会通过，见
 *      `packages/utils/src/is.ts` 的文件头）。所以 `ellipsis={[]}` 会走展开分支。
 *      这是上游的真实行为，别「顺手修」成严格判定。
 *
 * ── 与 antd 的一处平台差异（PLATFORM）──────────────────────────────────────────
 *
 * antd 的 `templateConfig` 里可以有**函数**（`ellipsis` 的默认 `symbol` 就是
 * `(isExpanded) => ...`）。React 每次渲染重建 `templateConfig` 对象字面量，
 * `useMemo` 的依赖随之变化、`config` 重算 —— 结果与「每次都算」等价。
 *
 * 我们用 `computed`，依赖是可追踪的：调用方传 getter（`() => ({...})`）即可，
 * 每次求值得到新对象会触发下游重算 —— 与 antd 一致。
 */

import { isPlainObject } from '@apollo-design/utils';
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';

export interface UseMergedConfigResult<Target> {
  /** `Boolean(propConfig)`。 */
  support: ComputedRef<boolean>;
  /** `{...templateConfig, ...(support && isPlainObject(propConfig) ? propConfig : null)}`。 */
  config: ComputedRef<Target>;
}

export function useMergedConfig<Target extends object>(
  propConfig: MaybeRefOrGetter<boolean | Target | undefined>,
  templateConfig?: MaybeRefOrGetter<Target | undefined>,
): UseMergedConfigResult<Target> {
  const support = computed(() => Boolean(toValue(propConfig)));

  const config = computed<Target>(() => {
    const prop = toValue(propConfig);
    return {
      ...toValue(templateConfig),
      ...(support.value && isPlainObject(prop) ? prop : null),
    } as Target;
  });

  return { support, config };
}
