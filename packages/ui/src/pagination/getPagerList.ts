/**
 * 页码列表算法（rc-pagination `Pagination.js` 的 `pagerList` 段）—— **纯函数**，逐行对齐。
 *
 * 为什么单独成文件：这是全组件最容易写错的一段（6 处边界），纯函数形态让 L1 能用
 * 「页数 × 当前页」的判定表直接覆盖，不必挂组件。
 *
 * ```
 * pageBufferSize = showLessItems ? 1 : 2
 * allPages <= 3 + pageBufferSize * 2   ⇒ 全列（allPages === 0 时放一个 disabled 的 1）
 * 否则：
 *   left = max(1, current - buffer); right = min(current + buffer, allPages)
 *   current - 1 <= buffer          ⇒ right = 1 + buffer * 2
 *   allPages - current <= buffer   ⇒ left = allPages - buffer * 2
 *   hasJumpPrev = showJumpers && current - 1 >= buffer * 2 && current !== 1 + 2      ← 魔数
 *   hasJumpNext = showJumpers && allPages - current >= buffer * 2 && current !== allPages - 2
 *   !showLessItems && hasJumpPrev && right !== allPages  ⇒ left += 1                 ← 挤位
 *   !showLessItems && hasJumpNext && left !== 1          ⇒ right -= 1
 *   渲染 left..right
 *   hasJumpPrev ⇒ 首项补 `-item-after-jump-prev` 并 unshift 跳页项
 *   hasJumpNext ⇒ 末项补 `-item-before-jump-next` 并 push 跳页项
 *   left !== 1 ⇒ unshift 页码 1；right !== allPages ⇒ push 页码 allPages
 * ```
 */

/** 列表里的一项。 */
export type PagerListItem =
  | {
      kind: 'page';
      page: number;
      active: boolean;
      /** `allPages === 0` 时的占位项（`-item-disabled`）。 */
      disabled: boolean;
      /** 跳页项相邻的补类（`item-after-jump-prev` / `item-before-jump-next`）。 */
      extraClass?: string;
    }
  | { kind: 'jump-prev' | 'jump-next'; page: number };

export interface PagerListOptions {
  /** 总页数（`floor((total - 1) / pageSize) + 1`，可能为 0）。 */
  allPages: number;
  /** 当前页（调用方已钳到 `[1, allPages]`，`allPages === 0` 时为 1）。 */
  current: number;
  /** `showLessItems`：每页更少页码（buffer 2→1、跳页步长 5→3）。 */
  showLessItems: boolean;
  /** `showPrevNextJumpers`。 */
  showPrevNextJumpers: boolean;
}

/** 计算页码列表（**不含** prev/next，那两个由调用方按 `hasPrev` / `hasNext` 渲染）。 */
export function getPagerList(options: PagerListOptions): PagerListItem[] {
  const { allPages, current, showLessItems, showPrevNextJumpers } = options;
  const pageBufferSize = showLessItems ? 1 : 2;
  const list: PagerListItem[] = [];

  if (allPages <= 3 + pageBufferSize * 2) {
    if (!allPages) {
      list.push({ kind: 'page', page: 1, active: false, disabled: true });
    }
    for (let i = 1; i <= allPages; i += 1) {
      list.push({ kind: 'page', page: i, active: current === i, disabled: false });
    }
    return list;
  }

  // 跳页项的目标页（±5，`showLessItems` 时 ±3）
  const jumpPrevPage = Math.max(1, current - (showLessItems ? 3 : 5));
  const jumpNextPage = Math.min(allPages, current + (showLessItems ? 3 : 5));

  let left = Math.max(1, current - pageBufferSize);
  let right = Math.min(current + pageBufferSize, allPages);
  if (current - 1 <= pageBufferSize) {
    right = 1 + pageBufferSize * 2;
  }
  if (allPages - current <= pageBufferSize) {
    left = allPages - pageBufferSize * 2;
  }

  const hasJumpPrev = showPrevNextJumpers && current - 1 >= pageBufferSize * 2 && current !== 1 + 2;
  const hasJumpNext =
    showPrevNextJumpers && allPages - current >= pageBufferSize * 2 && current !== allPages - 2;

  if (!showLessItems && hasJumpPrev && right !== allPages) {
    left += 1;
  }
  if (!showLessItems && hasJumpNext && left !== 1) {
    right -= 1;
  }

  for (let i = left; i <= right; i += 1) {
    list.push({ kind: 'page', page: i, active: current === i, disabled: false });
  }

  if (hasJumpPrev) {
    list[0] = {
      ...(list[0] as Extract<PagerListItem, { kind: 'page' }>),
      extraClass: 'item-after-jump-prev',
    };
    list.unshift({ kind: 'jump-prev', page: jumpPrevPage });
  }
  if (hasJumpNext) {
    const lastIndex = list.length - 1;
    list[lastIndex] = {
      ...(list[lastIndex] as Extract<PagerListItem, { kind: 'page' }>),
      extraClass: 'item-before-jump-next',
    };
    list.push({ kind: 'jump-next', page: jumpNextPage });
  }
  if (left !== 1) {
    list.unshift({ kind: 'page', page: 1, active: false, disabled: false });
  }
  if (right !== allPages) {
    list.push({ kind: 'page', page: allPages, active: false, disabled: false });
  }

  return list;
}

/** `floor((total - 1) / pageSize) + 1`（`total === 0` ⇒ 0）。 */
export function calculatePage(pageSize: number, total: number): number {
  return Math.floor((total - 1) / pageSize) + 1;
}
