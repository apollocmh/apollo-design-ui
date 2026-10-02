/**
 * `ListContext` —— `List` 注入给 `List.Item` 的 `grid` / `itemLayout`。
 *
 * 契约来源：antd 6.6.4 的 `es/list/context.ts`（12 行）。
 *
 * ── 🚨 与上游的一处**必须**的平台差异 ─────────────────────────────────────────
 *
 * 上游是 `React.createContext({})` —— React 的 Provider 更新会重跑消费者的**函数体**。
 * Vue 的 `inject` **只在 `setup()` 解析一次**，裸对象是**快照**：`List` 的
 * `grid` / `itemLayout` 后续变化**不会**传导到已挂载的 `Item`（`-item-no-flex`、
 * `grid ? 'div' : 'li'`、两段式分支全部会停在旧值）。
 *
 * ⇒ 注入的必须是 **`ComputedRef`**，`Item` 在 render 里读 `.value`（D37 / D39 家族，
 *    与 `spaceContextKey` / `sizeContextKey` 同判）。
 */

import { type ComputedRef, computed, type InjectionKey, inject } from 'vue';
import type { ListConsumerProps } from './interface';

/** 无 Provider 时的兜底（与上游 `createContext({})` 的默认值一致）。 */
const EMPTY_CONTEXT: ComputedRef<ListConsumerProps> = computed(() => ({}));

/** `List` 注入、`List.Item` 消费。⚠️ 值是 `ComputedRef`，不是裸对象。 */
export const listContextKey: InjectionKey<ComputedRef<ListConsumerProps>> =
  Symbol('apolloListContext');

/** 读 `ListContext`。无 Provider 时返回恒为 `{}` 的 `ComputedRef`。 */
export function useListContext(): ComputedRef<ListConsumerProps> {
  return inject(listContextKey, EMPTY_CONTEXT);
}
