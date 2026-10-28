/** Reactive latestIndex context. The DOM-free SpaceItems provider receives current rendered children. */
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
