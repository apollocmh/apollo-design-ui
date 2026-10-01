/**
 * 列数解析（上游 `Masonry.tsx:132-151` 的 `useMemo`）。
 *
 * ⚠️ **纯函数**，与 `positions.ts` 同理 —— 上游那份只有 `useMemo` 一层壳。
 *
 * ── 三条判据（顺序不能换）────────────────────────────────────────────────────
 *
 * 1. **没给 `columns` ⇒ 3**（`if (!columns) return 3`）。⚠️ 判据是 **falsy**，
 *    所以 `columns={0}` 也走不到这里（`0` 是 falsy ⇒ 返回 **3**，不是 0）！
 *    这与「`columns: 0` 得到 0 列」的直觉相反 —— 上游逐字如此。
 * 2. **数字 ⇒ 直接用**（`isNumber`，不是 `typeof === 'number'` 的宽松版）。
 * 3. **对象 ⇒ 按 `responsiveArray`（从大到小）取第一个「命中且非 `undefined`」的**；
 *    一个都没命中 ⇒ **`columns.xs ?? 1`**。
 *    ⚠️ 「从大到小」意味着取的是**不小于当前屏幕的最接近断点**的配置。
 *    ⚠️ 兜底是 `xs ?? 1`，**不是 1** —— 显式给了 `xs` 就用它。
 *
 * ⚠️ `screens` 在 SSR / 挂载前是 `{}`（不是 `null`）—— 那时 `screens[bp]` 全 `undefined`
 * ⇒ 一个断点都不命中 ⇒ 走 `columns.xs ?? 1`。本仓用 `screens?.[bp]` 顺带兼容 `null`
 * （`useBreakpoint` 的类型是 `Ref<Screens | null>`）。
 */

import { isNumber } from '@apollo-design/utils';
import {
  type Breakpoint,
  responsiveArray,
  type Screens,
} from '../../_internal/responsive-observer';

/** 未给 `columns` 时的默认列数（上游 `Masonry.tsx:133`）。 */
export const DEFAULT_COLUMN_COUNT = 3;

/** `columns` prop 的取值形态。 */
export type ColumnsProp = number | Partial<Record<Breakpoint, number>> | undefined;

/** 解析出实际列数。 */
export function resolveColumnCount(columns: ColumnsProp, screens: Screens | null): number {
  // ① falsy ⇒ 默认 3（`columns={0}` 也走这条，见文件头）
  if (!columns) {
    return DEFAULT_COLUMN_COUNT;
  }

  // ② 数字直接返回
  if (isNumber(columns)) {
    return columns;
  }

  // ③ 响应式对象：从大到小找第一个命中且非 undefined 的断点
  const matchingBreakpoint = responsiveArray.find(
    (breakpoint) => screens?.[breakpoint] && columns[breakpoint] !== undefined,
  );

  if (matchingBreakpoint !== undefined) {
    const matched = columns[matchingBreakpoint];
    // `find` 的谓词已经保证非 undefined；这里再收窄一次是为了**不用 `as`**
    // （`noUncheckedIndexedAccess` 下索引访问是 `number | undefined`）。
    if (matched !== undefined) {
      return matched;
    }
  }

  // 一个都没命中 ⇒ `xs ?? 1`
  return columns.xs ?? 1;
}
