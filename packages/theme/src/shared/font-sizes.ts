export interface FontSizePair {
  size: number;
  lineHeight: number;
}

/**
 * 10 档，定长元组而**不是** `FontSizePair[]`。
 *
 * 为什么必须是元组：仓库开了 `noUncheckedIndexedAccess`，
 * 用数组的话 `pairs[6].size` 的类型是 `number | undefined`，下游要么加 `!`（掩盖真实风险），
 * 要么到处写兜底分支（覆盖率里出现不可达代码）。定长元组让"一定有 10 档"这件事进入类型系统。
 */
export type FontSizePairs = readonly [
  FontSizePair,
  FontSizePair,
  FontSizePair,
  FontSizePair,
  FontSizePair,
  FontSizePair,
  FontSizePair,
  FontSizePair,
  FontSizePair,
  FontSizePair,
];

export function getLineHeight(fontSize: number): number {
  return (fontSize + 8) / fontSize;
}

/**
 * 以 base 为基准生成 10 档字号。
 *
 * 公式来源见 antd 注释里引用的 https://zhuanlan.zhihu.com/p/32746810（指数分级）。
 * 三个细节不能改：
 *   - `index > 1` 用 floor、否则用 ceil（保证比 base 小的那一档不会塌成 0）
 *   - 结果统一取偶（`Math.floor(intSize / 2) * 2`）
 *   - **第 2 档强制等于 base**，抵消取整误差。非整数 base（如 12.5）时这一条才会显出差别：
 *     ceil(12.5) → 13 → 取偶 → 12，强制回填后才回到 12.5。
 */
export default function genFontSizes(base: number): FontSizePairs {
  const pairAt = (index: number): FontSizePair => {
    if (index === 1) return { size: base, lineHeight: getLineHeight(base) };
    const i = index - 1;
    const baseSize = base * Math.E ** (i / 5);
    const intSize = index > 1 ? Math.floor(baseSize) : Math.ceil(baseSize);
    const size = Math.floor(intSize / 2) * 2;
    return { size, lineHeight: getLineHeight(size) };
  };

  return [
    pairAt(0),
    pairAt(1),
    pairAt(2),
    pairAt(3),
    pairAt(4),
    pairAt(5),
    pairAt(6),
    pairAt(7),
    pairAt(8),
    pairAt(9),
  ];
}
