/**
 * 范围计算与偏移钳制。
 *
 * 契约来源：`@rc-component/virtual-list@1.5.1/es/List.js:62-64`（两个开关）、
 * `:120-181`（核心循环）、`:232-239`（纵向钳制）、`:291-297`（横向钳制）。
 *
 * 本文件是纯函数：不涉及 DOM，可以在 L1 里穷举。
 */

import type { GetKey, HeightsLookup, RangeResult } from './types';

/**
 * 是否启用虚拟滚动（`List.js:62`）。
 *
 * ```js
 * const useVirtual = !!(virtual !== false && height && itemHeight);
 * ```
 *
 * ⚠️ `height` 与 `itemHeight` 都必须**是正的真值** —— 0 与 `undefined` 都不行。
 *    这是「不传 `itemHeight` 就没法估算」的直接后果。
 */
export function shouldUseVirtual(
  virtual: boolean | undefined,
  height: number | undefined,
  itemHeight: number | undefined,
): boolean {
  return Boolean(virtual !== false && height && itemHeight);
}

/**
 * 数据是否「多到值得虚拟化」（`List.js:64`）。
 *
 * ```js
 * const inVirtual = useVirtual && data &&
 *   (Math.max(itemHeight * data.length, containerHeight) > height || !!scrollWidth);
 * ```
 *
 * ⚠️ 用 **`Math.max(估算总高, 已测量总高)`** 而不是只看其一：
 *    动态高度下 `itemHeight * len` 可能远小于真实总高，只看它会在数据少时误判为
 *    「不需要虚拟化」。反过来 `containerHeight` 在还没测过任何项时是 0。
 *
 * @param containerHeight **已测量高度的总和**（不是 `itemHeight * length`）
 */
export function isInVirtual(
  useVirtual: boolean,
  dataLength: number,
  itemHeight: number,
  containerHeight: number,
  height: number,
  scrollWidth: number | undefined,
): boolean {
  if (!useVirtual || dataLength === 0) {
    return false;
  }
  return Math.max(itemHeight * dataLength, containerHeight) > height || Boolean(scrollWidth);
}

export interface ComputeRangeInput<T> {
  data: readonly T[];
  getKey: GetKey<T>;
  heights: HeightsLookup;
  itemHeight: number;
  /** 容器高 */
  height: number;
  /** 当前 `scrollTop` */
  offsetTop: number;
  useVirtual: boolean;
  inVirtual: boolean;
  /**
   * **非虚拟**路径下 Filler 内层的实测高度（`fillerInnerRef.current?.offsetHeight || 0`）。
   * 这条路径要靠它把滚动高度撑起来，因为此时 `scrollHeight` 没被计算。
   */
  measuredInnerHeight: number;
}

/**
 * 核心范围循环（`List.js:120-181`）。
 *
 * 逐条照抄的判据见契约文档 §3.2，这里只重复最容易改错的四条：
 *   1. `start` 用 `>=`，`end` 用 `>`（差一项）
 *   2. 未测量的项用 `itemHeight` 兜底（不是 0、不是跳过）
 *   3. 末尾多渲染一项（`endIndex + 1`，再 `min(len - 1)`）
 *   4. `startIndex === undefined` 时 `endIndex` 取 `Math.ceil(height / itemHeight)`
 *      （不是 `len - 1`）—— 对应「滚到底后数据被截短」
 */
export function computeRange<T>(input: ComputeRangeInput<T>): RangeResult {
  const {
    data,
    getKey,
    heights,
    itemHeight,
    height,
    offsetTop,
    useVirtual,
    inVirtual,
    measuredInnerHeight,
  } = input;
  const len = data.length;

  if (!useVirtual) {
    return { scrollHeight: undefined, start: 0, end: len - 1, offset: undefined };
  }

  if (!inVirtual) {
    return { scrollHeight: measuredInnerHeight, start: 0, end: len - 1, offset: undefined };
  }

  let itemTop = 0;
  let startIndex: number | undefined;
  let startOffset: number | undefined;
  let endIndex: number | undefined;

  // 用 entries() 而不是 data[i]：`noUncheckedIndexedAccess` 下 data[i] 是 T | undefined，
  // 而 getKey 要 T。语义与上游的下标循环一致。
  for (const [i, item] of data.entries()) {
    const cacheHeight = heights.get(getKey(item));
    const currentItemBottom = itemTop + (cacheHeight === undefined ? itemHeight : cacheHeight);

    // 项底**贴住**视口顶也算已进入（>=）
    if (currentItemBottom >= offsetTop && startIndex === undefined) {
      startIndex = i;
      startOffset = itemTop;
    }

    // 项底**超出**视口底才算结束（>）；多渲染一项给动画用
    if (currentItemBottom > offsetTop + height && endIndex === undefined) {
      endIndex = i;
    }

    itemTop = currentItemBottom;
  }

  // 滚到底后数据被截短会走到这里
  if (startIndex === undefined) {
    startIndex = 0;
    startOffset = 0;
    endIndex = Math.ceil(height / itemHeight);
  }

  if (endIndex === undefined) {
    endIndex = len - 1;
  }

  return {
    scrollHeight: itemTop,
    start: startIndex,
    end: Math.min(endIndex + 1, len - 1),
    offset: startOffset,
  };
}

/**
 * 纵向钳制（`List.js:232-239`）。
 *
 * ⚠️ **只有上界受 `NaN` 保护**：
 *   - `keepInRange(NaN, 100)` → `Math.max(NaN, 0)` → **`NaN`**
 *   - `keepInRange(Infinity, NaN)` → 跳过上界 → `Math.max(Infinity, 0)` → **`Infinity`**
 *
 * 看起来像疏漏，但它是可观察行为，照抄。见契约文档 §3.3。
 *
 * @param maxScrollHeight `scrollHeight - height`；`scrollHeight` 为 `undefined` 时是 `NaN`
 */
export function keepInRange(newScrollTop: number, maxScrollHeight: number): number {
  let newTop = newScrollTop;
  if (!Number.isNaN(maxScrollHeight)) {
    newTop = Math.min(newTop, maxScrollHeight);
  }
  return Math.max(newTop, 0);
}

/**
 * 横向钳制（`List.js:291-297`）。
 *
 * ⚠️ 与纵向**不同**：先 `max(..., 0)` 再 `min(..., max)`，而且 `max` 在没设 `scrollWidth`
 *    时是 **0** ⇒ 横向偏移被压成 0（不是「不钳制」）。
 */
export function keepInHorizontalRange(
  nextOffsetLeft: number,
  scrollWidth: number | undefined,
  containerWidth: number,
): number {
  const max = scrollWidth ? scrollWidth - containerWidth : 0;
  let tmp = nextOffsetLeft;
  tmp = Math.max(tmp, 0);
  tmp = Math.min(tmp, max);
  return tmp;
}

/** 已测量高度的总和（`List.js:63`）。`heights.maps` 的 values 求和。 */
export function sumHeights(heights: Readonly<Record<string, number | undefined>>): number {
  let total = 0;
  for (const value of Object.values(heights)) {
    if (typeof value === 'number') {
      total += value;
    }
  }
  return total;
}
