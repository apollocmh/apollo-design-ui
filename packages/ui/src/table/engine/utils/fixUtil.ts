/**
 * `@rc-component/table@1.11.1` 的 `es/utils/fixUtil.js`（65 行）—— **逐字移植**。
 *
 * 固定列的**全部几何**都在这里：偏移、阴影、z-index。
 * ⚠️ 这些值最终变成单元格上的 `insetInlineStart/End` 与
 * `--z-offset` / `--z-offset-reverse` 两个 CSS 变量（`Cell` 里写）⇒
 * **jsdom 测不到，只有 L6 抓得到**。
 */

/** 归一化之后的 `fixed` 值（`flatColumns` 已把 `true`/`left`→`start`、`right`→`end`）。 */
interface FixableColumn {
  fixed?: unknown;
}

export interface StickyOffsets {
  /** 每列的「粘滞偏移」：固定列的宽度前缀和（非固定列沿用前一个值）。 */
  start: number[];
  end: number[];
  /** 每列的实测宽度（阴影偏移要用**非固定列**的宽度累加）。 */
  widths: number[];
  isSticky?: boolean;
}

export interface CellFixedInfo {
  fixStart: number | null;
  fixEnd: number | null;
  fixedStartShadow: boolean;
  fixedEndShadow: boolean;
  offsetFixedStartShadow: number;
  offsetFixedEndShadow: number;
  isSticky: boolean | undefined;
  zIndex: number;
  zIndexReverse: number;
}

const isFixedStart = (column: FixableColumn): boolean => column.fixed === "start";
const isFixedEnd = (column: FixableColumn): boolean => column.fixed === "end";

/**
 * 算一个单元格的固定信息。
 *
 * 判据（逐字）：
 *  1. `fixStart` 只在 `colStart` 与 `colEnd` **都**是 start 固定时才有值
 *     （合并单元格跨到非固定列时不固定）；`fixEnd` 同理；
 *  2. 阴影：`fixedStartShadow = 右边一列不存在或不是 start 固定`（即「我是固定块的最右一个」）；
 *  3. `zIndex`：start 用 `columns.length*2 - colStart`（**start 永远压过 end**），
 *     end 用 `colEnd`；`zIndexReverse` 对应反向；
 *  4. 阴影偏移：start 侧累加 `colStart` **之前**的**非固定**列宽；end 侧累加 `colEnd` **之后**的。
 */
export function getCellFixedInfo(
  colStart: number,
  colEnd: number,
  columns: readonly FixableColumn[],
  stickyOffsets: StickyOffsets,
): CellFixedInfo {
  const startColumn = columns[colStart] || {};
  const endColumn = columns[colEnd] || {};

  let fixStart: number | null = null;
  let fixEnd: number | null = null;
  if (isFixedStart(startColumn) && isFixedStart(endColumn)) {
    fixStart = stickyOffsets.start[colStart] ?? null;
  } else if (isFixedEnd(endColumn) && isFixedEnd(startColumn)) {
    fixEnd = stickyOffsets.end[colEnd] ?? null;
  }

  let fixedStartShadow = false;
  let fixedEndShadow = false;
  let zIndex = 0;
  let zIndexReverse = 0;

  if (fixStart !== null) {
    const next = columns[colEnd + 1];
    fixedStartShadow = !next || !isFixedStart(next);
    zIndex = columns.length * 2 - colStart;
    zIndexReverse = columns.length + colStart;
  }
  if (fixEnd !== null) {
    const prev = columns[colStart - 1];
    fixedEndShadow = !prev || !isFixedEnd(prev);
    zIndex = colEnd;
    zIndexReverse = columns.length - colEnd;
  }

  let offsetFixedStartShadow = 0;
  let offsetFixedEndShadow = 0;
  if (fixedStartShadow) {
    for (let i = 0; i < colStart; i += 1) {
      const column = columns[i];
      if (column && !isFixedStart(column)) {
        offsetFixedStartShadow += stickyOffsets.widths[i] || 0;
      }
    }
  }
  if (fixedEndShadow) {
    for (let i = columns.length - 1; i > colEnd; i -= 1) {
      const column = columns[i];
      if (column && !isFixedEnd(column)) {
        offsetFixedEndShadow += stickyOffsets.widths[i] || 0;
      }
    }
  }

  return {
    fixStart,
    fixEnd,
    fixedStartShadow,
    fixedEndShadow,
    offsetFixedStartShadow,
    offsetFixedEndShadow,
    isSticky: stickyOffsets.isSticky,
    zIndex,
    zIndexReverse,
  };
}
