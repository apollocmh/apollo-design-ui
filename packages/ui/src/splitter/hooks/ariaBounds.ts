/**
 * Splitter 拖拽条的 ARIA 上下界 —— 算术同源 antd 6.6.4 `es/splitter/Splitter.js:181-201`，
 * 但**收口了 ARIA 合法性**（Issue #51）。
 *
 * ⚠️ 抽成纯函数的动机是**可验证**：这段算术依赖 `stackSizes`（容器百分比累计），而容器
 *    尺寸在 jsdom 下恒为 0 ⇒ 组件级只能看到退化解，上下界的真实形态无法在 DOM 上钉住。
 *
 * 🚨 为什么必须与上游**不同**（这是有意的偏离，不是照抄）:
 *   ARIA 要求 `aria-valuemin <= aria-valuenow <= aria-valuemax`，屏幕阅读器据此告知用户
 *   「能往哪个方向拖、拖多远」。上游算式在两个**真实可达**的场景下会产出非法值：
 *
 *   1. 容器**未测量**（首帧 / SSR / jsdom）：`ptgMaxSizes = (item.max || 0) / 0` = `NaN`
 *      ⇒ `Math.max/min` 结果也是 `NaN`。上游靠 `SplitBar.getValidNumber` 把它归一成 `0`
 *      ⇒ 实际渲染出 `valuemin=0 / valuemax=0 / valuenow=50` —— now 落在区间之外。
 *      本实现把非有限比例回退到「无约束」语义（min 0 / max 1），得到 `0 / 100 / 50`。
 *
 *   2. **约束不可满足**（如两侧面板 `min` 之和 > 100%）：`Math.max` 与 `Math.min` 各取一侧
 *      极值 ⇒ `min > max`（区间反转）。此时本实现退化为「不可拖」单点 = 当前位置。
 *
 * 🚨 **退化为单点而非「交换 min/max」的取舍**：这个分支下拖拽会被相邻两侧互相夹死，
 *   实测 `onOffsetUpdate` 的对齐会把 offset 归零（拖不动）—— 见本文件的回归测试。
 *   若改成单纯交换成 `max / min`，等于向辅助技术谎报一段根本拖不到的区间，
 *   违反「ARIA 语义必须与实际可拖范围一致」。
 *
 * 最后统一把 `now` 夹到 `[min, max]`，保证三个返回值恒为**有限且逻辑一致**的数值。
 */

export interface AriaBounds {
  /** `aria-valuenow` */
  now: number;
  /** `aria-valuemin` */
  min: number;
  /** `aria-valuemax` */
  max: number;
}

/**
 * 非有限值（`NaN` / `±Infinity`）⇒ 回退值。
 *
 * 回退值取「该 semantically 无约束」的默认：`min` 视为 0、`max` 视为 1（整条容器），
 * 与 `getAriaBounds` 里原有的 `?? 0` / `?? 1` 缺省口径保持一致。
 */
function finite(v: number | undefined, fallback: number): number {
  return Number.isFinite(v) ? (v as number) : fallback;
}

export function getAriaBounds(
  stackSizes: readonly number[],
  ptgMinSizes: readonly number[],
  ptgMaxSizes: readonly number[],
  idx: number,
): AriaBounds {
  const prevStackSize = finite(stackSizes[idx - 1], 0);
  const nextStackSize = finite(stackSizes[idx + 1], 1);
  const ariaMinStart = prevStackSize + finite(ptgMinSizes[idx], 0);
  const ariaMinEnd = nextStackSize - finite(ptgMaxSizes[idx + 1], 1);
  const ariaMaxStart = prevStackSize + finite(ptgMaxSizes[idx], 1);
  const ariaMaxEnd = nextStackSize - finite(ptgMinSizes[idx + 1], 0);

  let min = Math.max(ariaMinStart, ariaMinEnd) * 100;
  let max = Math.min(ariaMaxStart, ariaMaxEnd) * 100;
  const now = finite(stackSizes[idx], 0) * 100;

  // ① 约束矛盾（不可能同时满足）⇒ 没有有效拖拽区间 ⇒ 退化为「不可拖」单点。
  if (min > max) {
    // 反转区间的两端：较小端是 `max`，较大端是 `min`。
    const lower = max;
    const upper = min;
    const point = Math.min(Math.max(now, lower), upper);
    min = point;
    max = point;
  }

  // ② `now` 必须落在 `[min, max]` 内。
  return { now: Math.min(Math.max(now, min), max), min, max };
}
