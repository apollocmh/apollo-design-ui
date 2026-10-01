/**
 * 瀑布流排布算法（上游 `es/masonry/hooks/usePositions.js`，53 行）。
 *
 * ⚠️ **本文件是纯函数**，不是 hook —— 上游那份只有 `useMemo` 一层壳，算法本身
 * 与 Vue 无关。纯函数才能在 L1（node，无 DOM）里直接钉住；组件侧用
 * `computed(() => computeItemPositions(...))` 包一层，语义等价。
 *
 * ── 算法（逐字照抄，三处易错点见下）──────────────────────────────────────────
 *
 * ```
 * columnHeights = 全 0，长度 = columnCount
 * for 每个 item（按 items 顺序）:
 *   target = item.column ?? columnHeights.indexOf(min(columnHeights))
 *   target = min(target, columnCount - 1)
 *   top    = columnHeights[target]
 *   positions.set(key, { column: target, top })
 *   columnHeights[target] += height + verticalGutter
 * totalHeight = max(0, max(columnHeights) - verticalGutter)
 * ```
 *
 * 1. 🚨 **`indexOf(Math.min(...))` 取的是第一个最小列** —— 平局时**永远往左靠**。
 *    写成 `findLastIndex` 或按高度排序都会让排布整体不同（L2 的期望值就是照这个写的）。
 * 2. 🚨 **显式 `item.column` 不参与 `min` 计算**，但仍要 `Math.min(…, columnCount - 1)`
 *    夹取 —— 否则 `column: 9`（列数 3）会把 `columnHeights[9]` 撑出一个洞。
 * 3. 🚨 **`totalHeight` 要减去一个 `verticalGutter`** —— 最后一行的 item 后面
 *    不该有间距；且必须 `Math.max(0, …)`：`columnCount === 0` 时
 *    `Math.max(...[])` 是 `-Infinity`。
 *
 * ⚠️ 算法是「按顺序稳定排布」，**不做后续 item 高度的动态回填**（上游注释明说
 * 「Always get stable positions by order instead of dynamic adjust for next item height」）。
 */

import type { MasonryKey } from '../interface';

/** 一个 item 的量测结果（上游 `ItemHeightData`）。 */
export type ItemHeightData = [key: MasonryKey, height: number, column?: number | undefined];

/** 排布结果（上游 `ItemPositions` 的值形态）。 */
export interface ItemPosition {
  column: number;
  top: number;
}

export type ItemPositions = Map<MasonryKey, ItemPosition>;

/**
 * 排布所有 item。
 *
 * @param itemHeights 逐项 `[key, height, column?]`，**顺序即 items 顺序**
 * @param columnCount 列数
 * @param verticalGutter 纵向间距（px）
 * @returns `[每个 key 的 {column, top}, 容器总高]`
 */
export function computeItemPositions(
  itemHeights: readonly ItemHeightData[],
  columnCount: number,
  verticalGutter: number,
): readonly [ItemPositions, number] {
  const columnHeights: number[] = Array.from({ length: columnCount }, () => 0);
  const itemPositions: ItemPositions = new Map();

  for (const [itemKey, itemHeight, itemColumn] of itemHeights) {
    // ① 平局取第一个（最左）—— 见文件头第 1 条
    const autoColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    // ② 显式列号优先，但仍要夹取 —— 见文件头第 2 条
    const targetColumnIndex = Math.min(itemColumn ?? autoColumnIndex, columnCount - 1);

    /**
     * ⚠️ 上游写的是裸 `columnHeights[targetColumnIndex]`。本仓 `noUncheckedIndexedAccess`
     * 下它是 `number | undefined`，`?? 0` 把**唯一**能取到 `undefined` 的情形
     * （`columnCount === 0`，即 `columns={0}`）收敛成 `0`。
     * 上游那条路径会写出 `top: undefined`（元素没有 `top` 样式）并让后续累加变成 `NaN`
     * —— 属未定义行为，本仓不复制 NaN 传播。登记为差异 D9。
     */
    const top = columnHeights[targetColumnIndex] ?? 0;
    itemPositions.set(itemKey, { column: targetColumnIndex, top });

    columnHeights[targetColumnIndex] = top + itemHeight + verticalGutter;
  }

  // ③ 减去最后一行的间距，并兜底 `-Infinity` —— 见文件头第 3 条
  return [itemPositions, Math.max(0, Math.max(...columnHeights) - verticalGutter)] as const;
}
