/**
 * `SpaceContext` —— `Space` 向 `Item` 传递「最后一个有内容的子节点下标」。
 *
 * 契约来源：antd 6.6.4 的 `es/space/context.js`（12 行）。
 *
 * ── 为什么需要它（而不是把 latestIndex 直接当 prop 传）─────────────────────────
 *
 * 分隔符的渲染判据是 `index < latestIndex && separator` —— 即
 * **最后一个「有内容」的 item 之后不渲染分隔符**。这个「最后一个」要跨整个
 * children 列表算，而 `Item` 只知道自己那一个下标。antd 用 context 把结果
 * 广播给每个 Item。
 *
 * Vue 侧可以走 prop 透传（`Space` 自己算好再传下去），但那样 `Space` 就必须
 * 显式把 `latestIndex` 穿进每个 `Item`，与 antd 的结构偏离 —— 而 `Item` 是
 * 用 `v-for` 渲染的，多传一个 prop 并不会更简单。保留 context 的另一个理由是
 * **它是公开导出**（`export { SpaceContext } from './context'`），
 * 迁移代码里 `useContext(SpaceContext)` 需要对应物。
 *
 * ── 与 antd 的差异（PLATFORM）──────────────────────────────────────────────────
 *
 * antd 的 context 值是**裸对象**，Provider 更新时 React 重跑消费者函数体。
 * Vue 的 `inject` 在 setup 期解析一次，裸对象是**快照**（D27）——
 * 所以这里注入的是 `ComputedRef`，消费者在 `computed` / render 里读 `.value`
 * 才会被追踪。这是本仓库所有 context 的统一形态（见 `size-context.ts`）。
 */

import { type ComputedRef, computed, type InjectionKey, inject } from 'vue';

/** 与 antd 的 `SpaceContextType` 一致。 */
export interface SpaceContextType {
  /** 最后一个「有内容」的子节点的下标。全空时为 `0`（antd 的 `reduce` 初值）。 */
  latestIndex: number;
}

/**
 * 注入键。值是 `ComputedRef` 而不是裸值 —— 见文件头。
 *
 * 用 `Symbol` 而不是字符串：避免与用户自己的 provide 键冲突。
 */
export const spaceContextKey: InjectionKey<ComputedRef<SpaceContextType>> =
  Symbol('apolloSpaceContext');

/**
 * 没有 Provider 时的默认值。
 *
 * antd 的 `createContext({ latestIndex: 0 })` 就是同一个语义：
 * 脱离 `Space` 使用 `Item` 时，下标 `0 < 0` 为假 ⇒ 不渲染分隔符。
 */
const DEFAULT_SPACE_CONTEXT: ComputedRef<SpaceContextType> = computed(() => ({ latestIndex: 0 }));

/** 读取 `SpaceContext`。没有 Provider 时返回 `{ latestIndex: 0 }`（与 antd 一致）。 */
export function useSpaceContext(): ComputedRef<SpaceContextType> {
  return inject(spaceContextKey, DEFAULT_SPACE_CONTEXT);
}
