/**
 * `DisabledContext` —— 全局禁用。
 *
 * 契约来源：antd 6.6.4 的 `es/config-provider/DisabledContext.tsx`。
 *
 * ⚠️ 合并判据是 **`??`（undefined 判据）**，不是 `SizeContext` 的 `||`（真值判据）：
 *    `componentDisabled={false}` 必须能**显式关闭**父级的 `true`。
 *    两个 context 的判据不同，别「顺手统一」。
 */

import {
  type ComputedRef,
  computed,
  type InjectionKey,
  inject,
  type MaybeRefOrGetter,
  toValue,
} from 'vue';

/** 注入键。值是 `ComputedRef`（理由同 `size-context.ts`）。 */
export const disabledContextKey: InjectionKey<ComputedRef<boolean>> =
  Symbol('apolloDisabledContext');

/** 默认值：未挂 Provider 时不禁用。 */
const DEFAULT_DISABLED: ComputedRef<boolean> = computed(() => false);

/**
 * 读取全局禁用态，与自己的 prop 合并。
 *
 * 组件侧的写法（与 antd 一致）：`const mergedDisabled = useDisabled(() => props.disabled)`。
 * `props.disabled` 为 `undefined` 时听 ConfigProvider；显式 `true` / `false` 时听自己。
 *
 * 🚨 入参是 **MaybeRefOrGetter**（2026-10-04 transfer 收口发现）—— 旧签名收裸值
 *    `useDisabled(props.disabled)`，在 setup 期一次性解包，**丢失响应性**：
 *    父组件后续把 disabled 从 true 改成 false（或反过来）时 computed 永远停在
 *    首帧值（Button / TreeSelect / Form / Cascader 都踩过；Button 的表现为
 *    「disabled 一旦为 true 就再也解不锁」）。传 **getter** `() => props.disabled`
 *    才是响应式等价形态；旧调用传字面量的行为不变（toValue 兼容）。
 */
export function useDisabled(
  customDisabled?: MaybeRefOrGetter<boolean | undefined>,
): ComputedRef<boolean> {
  const injected = inject(disabledContextKey, DEFAULT_DISABLED);

  return computed(() => toValue(customDisabled) ?? injected.value);
}
