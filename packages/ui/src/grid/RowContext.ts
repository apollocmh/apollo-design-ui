/**
 * Row → Col 的注入上下文。
 *
 * 契约来源：antd 6.6.4 的 `es/grid/RowContext.js`（createContext({})）。
 * 无 Provider 时的兜底与 antd 一致：空对象（Col 读到 `gutter?.[0]` 全 falsy，
 * 不产生任何 gutter padding）。
 */

import { computed, type InjectionKey, inject, provide } from 'vue';
import type { RowContextValue } from './interface';

export const rowContextKey: InjectionKey<RowContextValue> = Symbol('apolloRowContext');

/** Row 侧：向后代 Col 提供 gutter 与 wrap（值必须是 ComputedRef —— 见 interface 注释）。 */
export function provideRowContext(value: RowContextValue): void {
  provide(rowContextKey, value);
}

/**
 * Col 侧：读取 Row 的上下文。没有 Row 祖先时给**恒空**的兜底实现
 * （antd 的 createContext({})：`gutter?.[0]` 全 falsy、wrap 为 undefined）。
 * 返回 ComputedRef 保持 Col 侧消费代码不需要分支。
 */
export function useRowContext(): RowContextValue {
  const fallback: RowContextValue = {
    gutter: computed(() => [undefined, undefined] as const),
    wrap: computed(() => undefined),
  };
  return inject(rowContextKey, fallback);
}
