/**
 * Splitter 拖拽条的 ARIA 上下界 —— antd 6.6.4 `es/splitter/Splitter.js:181-201` 逐字。
 *
 * ⚠️ 抽成纯函数的唯一动机是**可验证**（Issue #51）：这段算术依赖 `stackSizes`
 *    （容器百分比累计），而容器尺寸在 jsdom 下恒为 0 ⇒ 组件级只能看到退化解，
 *    上下界的真实形态无法在 DOM 上钉住。抽出来后可以直接对「已测量容器」求解并
 *    断言 `min <= now <= max`。
 *
 * 判据（与上游同源的边界事实，不要「顺手修」）：
 *   1. 入参 `ptgMaxSizes` 在容器**未测量**时是 `(item.max || 0) / 0` = `NaN`
 *      （见 `useSizes.ts` 的 `postPercentMaxSizes`，上游同式）⇒ `Math.max/min`
 *      结果也是 `NaN`，最终由 `SplitBar` 的 `getValidNumber` 归一成 `0`。
 *   2. 面板 `min` 之和 > 100% 这类**互相矛盾**的约束下可能产出 `min > max`
 *      （`Math.max` 与 `Math.min` 各取一侧极值）—— 上游同式同结果。
 *   3. 返回的是**未取整的百分比 ×100**；`Math.round` 与有限性归一在 `SplitBar`。
 */

export interface AriaBounds {
  /** `aria-valuenow` */
  now: number;
  /** `aria-valuemin` */
  min: number;
  /** `aria-valuemax` */
  max: number;
}

export function getAriaBounds(
  stackSizes: readonly number[],
  ptgMinSizes: readonly number[],
  ptgMaxSizes: readonly number[],
  idx: number,
): AriaBounds {
  const prevStackSize = Number.isFinite(stackSizes[idx - 1]) ? (stackSizes[idx - 1] as number) : 0;
  const nextStackSize = Number.isFinite(stackSizes[idx + 1]) ? (stackSizes[idx + 1] as number) : 1;
  const ariaMinStart = prevStackSize + (ptgMinSizes[idx] ?? 0);
  const ariaMinEnd = nextStackSize - (ptgMaxSizes[idx + 1] ?? 1);
  const ariaMaxStart = prevStackSize + (ptgMaxSizes[idx] ?? 1);
  const ariaMaxEnd = nextStackSize - (ptgMinSizes[idx + 1] ?? 0);

  return {
    now: (stackSizes[idx] ?? 0) * 100,
    min: Math.max(ariaMinStart, ariaMinEnd) * 100,
    max: Math.min(ariaMaxStart, ariaMaxEnd) * 100,
  };
}
