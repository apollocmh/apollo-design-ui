/**
 * Splitter 的尺寸工具（契约来源：antd 6.6.4 `es/splitter/hooks/sizeUtil.js`，
 * 逐行对拍——百分比归一化状态机的纯函数部分）。
 */

/** `'50%'` ⇒ 0.5。 */
export function getPtg(str: string): number {
  return Number(str.slice(0, -1)) / 100;
}

/** 是否百分比尺寸字符串。 */
export function isPtg(itemSize: unknown): itemSize is string {
  return typeof itemSize === 'string' && itemSize.endsWith('%');
}

/**
 * 把 sizes 夹取到 [min, max] 并把差额按各面板的「可伸展空间」分摊回去
 * （折叠面板 size=0 忽略 min/max —— 上游如此）。
 */
function fitPtgSizes(sizes: number[], minSizes: number[], maxSizes: number[]): number[] {
  // Collapsed panels should stay at 0 even when they have a min size.
  const mergedMinSizes = sizes.map((size, index) => (size === 0 ? 0 : (minSizes[index] ?? 0)));
  const mergedMaxSizes = sizes.map((size, index) => (size === 0 ? 0 : (maxSizes[index] ?? 1)));

  const invalidLimits = mergedMinSizes.some((min, index) => min > (mergedMaxSizes[index] ?? 1));
  const totalMin = mergedMinSizes.reduce((sum, size) => sum + size, 0);
  const totalMax = mergedMaxSizes.reduce((sum, size) => sum + size, 0);

  // Keep the normalized proportions when the limits cannot fit the container.
  if (invalidLimits || totalMin > 1 || totalMax < 1) {
    return sizes;
  }

  const result = sizes.map((size, index) =>
    Math.min(mergedMaxSizes[index] ?? 1, Math.max(mergedMinSizes[index] ?? 0, size)),
  );
  const total = result.reduce((sum, size) => sum + size, 0);
  if (total === 1) {
    return result;
  }

  const grow = total < 1;
  const spaces = result.map((size, index) =>
    grow ? (mergedMaxSizes[index] ?? 1) - size : size - (mergedMinSizes[index] ?? 0),
  );
  const totalSpace = spaces.reduce((sum, space) => sum + space, 0);
  const rest = 1 - total;
  return result.map((size, index) => size + rest * ((spaces[index] ?? 0) / totalSpace));
}

/**
 * 把「部分定义」的百分比列表补齐成总值为 1 的完整列表：
 * ① 全定义但和≠1 ⇒ 缩放 + fit；② 超额 ⇒ 缩放（undefined 归 0）；
 * ③ 有 undefined ⇒ 均分 / 贪婪填充（受 min/max 约束）；④ 极端情况均分。
 */
export function autoPtgSizes(
  ptgSizes: (number | undefined)[],
  minPtgSizes: number[],
  maxPtgSizes: number[],
): number[] {
  // Static current data
  let currentTotalPtg = 0;
  const undefinedIndexes: number[] = [];
  ptgSizes.forEach((size, index) => {
    if (size === undefined) {
      undefinedIndexes.push(index);
    } else {
      currentTotalPtg += size;
    }
  });

  const restPtg = 1 - currentTotalPtg;
  const undefinedCount = undefinedIndexes.length;

  // If all sizes are defined but don't sum to 1, scale them.
  if (ptgSizes.length && !undefinedIndexes.length && currentTotalPtg !== 1) {
    // Handle the case when all sizes are 0
    if (currentTotalPtg === 0) {
      const avg = 1 / ptgSizes.length;
      return ptgSizes.map(() => avg);
    }
    const scale = 1 / currentTotalPtg;
    const scaledSizes = ptgSizes.map((size) => (size as number) * scale);
    return fitPtgSizes(scaledSizes, minPtgSizes, maxPtgSizes);
  }

  // Fill if exceed
  if (restPtg < 0) {
    const scale = 1 / currentTotalPtg;
    return ptgSizes.map((size) => (size === undefined ? 0 : (size as number) * scale));
  }

  // Check if limit exists
  let sumMin = 0;
  let sumMax = 0;
  let limitMin = 0;
  let limitMax = 1;
  for (const index of undefinedIndexes) {
    const min = minPtgSizes[index] || 0;
    const max = maxPtgSizes[index] || 1;
    sumMin += min;
    sumMax += max;
    limitMin = Math.max(limitMin, min);
    limitMax = Math.min(limitMax, max);
  }

  // Impossible case, just average fill
  if (sumMin > 1 && sumMax < 1) {
    const avg = 1 / undefinedCount;
    return ptgSizes.map((size) => (size === undefined ? avg : size));
  }

  // Quickly fill if can
  const restAvg = restPtg / undefinedCount;
  if (limitMin <= restAvg && restAvg <= limitMax) {
    return ptgSizes.map((size) => (size === undefined ? restAvg : size));
  }

  // Greedy algorithm
  const result: number[] = ptgSizes.map((size) => size ?? 0);
  let remain = restPtg - sumMin;
  for (let i = 0; i < undefinedCount; i += 1) {
    const index = undefinedIndexes[i] as number;
    const min = minPtgSizes[index] || 0;
    const max = maxPtgSizes[index] || 1;
    result[index] = min;
    const canAdd = max - min;
    const add = Math.min(canAdd, remain);
    result[index] = (result[index] as number) + add;
    remain -= add;
  }
  return result;
}
