/**
 * `DisabledContext` —— 全局禁用。
 *
 * 契约来源：antd 6.6.4 的 `es/config-provider/DisabledContext.tsx`。
 *
 * ⚠️ 合并判据是 **`??`（undefined 判据）**，不是 `SizeContext` 的 `||`（真值判据）：
 *    `componentDisabled={false}` 必须能**显式关闭**父级的 `true`。
 *    两个 context 的判据不同，别「顺手统一」。
 */

import { type ComputedRef, computed, type InjectionKey, inject } from 'vue';

/** 注入键。值是 `ComputedRef`（理由同 `size-context.ts`）。 */
export const disabledContextKey: InjectionKey<ComputedRef<boolean>> =
  Symbol('apolloDisabledContext');

/** 默认值：未挂 Provider 时不禁用。 */
const DEFAULT_DISABLED: ComputedRef<boolean> = computed(() => false);

/**
 * 读取全局禁用态，与自己的 prop 合并。
 *
 * 组件侧的写法（与 antd 一致）：`const mergedDisabled = useDisabled(props.disabled)`。
 * `props.disabled` 为 `undefined` 时听 ConfigProvider；显式 `true` / `false` 时听自己。
 */
export function useDisabled(customDisabled?: boolean): ComputedRef<boolean> {
  const injected = inject(disabledContextKey, DEFAULT_DISABLED);

  return computed(() => customDisabled ?? injected.value);
}
