/**
 * `SizeContext` —— 组件尺寸。
 *
 * 契约来源：antd 6.6.4 的 `es/config-provider/SizeContext.tsx` + `hooks/useSize.ts`。
 *
 * ── 为什么它是**独立 context** 而不是 ConfigContext 的一个字段 ──────────────────
 *
 * antd 把它拆出去是为了「`componentSize` 变化时只重渲染读尺寸的组件」。
 * 本项目的理由更硬：`ConfigContextValue` 是**一个**响应式对象，任何字段变化都会
 * 触发所有读它的 `computed` 重算；而尺寸是被最多组件读的字段之一，独立出来能明显
 * 收窄依赖面。形态上也与 antd 对齐（便于迁移）。
 */

import { type ComputedRef, computed, type InjectionKey, inject } from 'vue';

/**
 * 尺寸。
 *
 * ⚠️ `'medium'` 与 `'middle'` **两个都要**：antd 6 起 `'medium'` 是推荐写法，
 * `'middle'` 仍是默认值且未移除（上游注释：`middle is deprecated and will be removed
 * in v7`）。`COMPONENT-RULES.md` §4 要求枚举值与 antd 一致 ⇒ 不裁剪成 `'medium'`。
 */
export type SizeType = 'small' | 'medium' | 'middle' | 'large';

/**
 * 注入键。
 *
 * 值是 `ComputedRef` 而不是裸值 —— 这样 `useSize` 在 `computed` 里读 `.value`
 * 会被追踪，`componentSize` 变化能传导到下游（对齐 antd 的 context 更新）。
 */
export const sizeContextKey: InjectionKey<ComputedRef<SizeType | undefined>> =
  Symbol('apolloSizeContext');

/**
 * 读取组件尺寸，与自己的 prop 合并。与 antd 的 `useSize` 逐字对应。
 *
 * 四条判据（逐条来自 `hooks/useSize.ts`）：
 *   1. `!customSize` ⇒ 用 context（⚠️ 真值判据：`0` / `''` 也走这一支）。
 *   2. `customSize` 是字符串 ⇒ `customSize ?? size`（字符串恒真，等价于直接返回）。
 *   3. `customSize` 是函数 ⇒ `customSize(size)`。
 *   4. 其余（数字 / 对象）⇒ 用 context。
 *
 * @example
 * ```ts
 * const mergedSize = useSize(props.size);   // ComputedRef<SizeType | undefined>
 * ```
 */
export function useSize<T extends string | number | undefined | object>(
  customSize?: T | ((ctxSize: SizeType | undefined) => T),
): ComputedRef<T | SizeType | undefined> {
  const injected = inject(sizeContextKey, undefined);

  return computed(() => {
    const ctxSize = injected?.value;

    if (!customSize) return ctxSize;

    if (typeof customSize === 'string') return customSize ?? ctxSize;

    if (typeof customSize === 'function') {
      return (customSize as (ctxSize: SizeType | undefined) => T)(ctxSize);
    }

    return ctxSize;
  });
}
