/**
 * Descriptions 的 items / 行切分纯函数 —— `es/descriptions/hooks/useItems.js` +
 * `hooks/useRow.js`（getCalcRows）的逐行移植。机械判据，勿凭记忆改写。
 */

import type { VNode, VNodeChild } from 'vue';
import { Comment, Fragment } from 'vue';
import type { Breakpoint, Screens } from '../_internal/responsive-observer';
import { matchScreen } from '../_internal/responsive-observer';
import type { DescriptionsItemType, DescriptionsRowItem } from './interface';

/** antd `constant.js` 的 DEFAULT_COLUMN_MAP。 */
export const DEFAULT_COLUMN_MAP: Partial<Record<Breakpoint, number>> = {
  xxxl: 4,
  xxl: 3,
  xl: 3,
  lg: 3,
  md: 3,
  sm: 2,
  xs: 1,
};

/**
 * children → items（`transChildren2Items`）：读每个 vnode 的 props（Item 语法糖）
 * + key。Comment 摊平剔除、Fragment 摊平。
 */
export function transChildren2Items(childNodes: VNodeChild[]): DescriptionsItemType[] {
  const out: DescriptionsItemType[] = [];
  const walk = (list: VNodeChild[]) => {
    for (const node of list) {
      if (!node || typeof node !== 'object') continue;
      const v = node as VNode;
      if (v.type === Comment) continue;
      if (v.type === Fragment) {
        walk((v.children as VNodeChild[]) ?? []);
        continue;
      }
      const props = (v.props ?? {}) as DescriptionsItemType & { children?: VNodeChild };
      out.push({ ...props, key: (v.key as string | number) ?? props.key });
    }
  };
  walk(childNodes);
  return out;
}

/**
 * useItems：`items` 优先，否则 children 转 items；然后把 span 归一化 ——
 * `'filled'` → `filled:true`（span 删除）；响应式对象 → matchScreen(screens, span)
 * （无激活断点 ⇒ undefined ⇒ getCalcRows 里按 1 处理，与 antd 一致）。
 */
export function normalizeItems(
  screens: Screens | undefined | null,
  items: DescriptionsItemType[] | undefined,
  children: VNodeChild[] | undefined,
): Omit<DescriptionsRowItem, 'index'> & { span?: number }[] {
  const merged = items ?? transChildren2Items(children ?? []);
  return merged.map(({ span, ...rest }) => {
    if (span === 'filled') {
      return rest as DescriptionsRowItem;
    }
    return {
      ...rest,
      span: typeof span === 'number' ? span : matchScreen(screens, span ?? {}),
    };
  });
}

/**
 * getCalcRows —— 行切分（useRow.js L6-56）：
 * - `count += item.span || 1`；`count >= column` 收行；
 * - 超出时 `exceed=true` 且当前 item span 压成 restSpan；
 * - `filled` item：推入当前行后立即收行；
 * - 行尾补齐：行内总 span < column 时最后一个 item 扩到 `column - (sum - lastSpan)`。
 */
export function getCalcRows(
  rowItems: (Omit<DescriptionsRowItem, 'index'> & { span?: number })[],
  mergedColumn: number,
): [rows: DescriptionsRowItem[][], exceed: boolean] {
  let rows: DescriptionsRowItem[][] = [];
  let tmpRow: DescriptionsRowItem[] = [];
  let exceed = false;
  let count = 0;
  let itemIndex = 0;

  rowItems
    .filter((n) => n)
    .forEach((rowItem) => {
      const { filled, ...restItem } = rowItem;
      if (filled) {
        tmpRow.push(restItem as DescriptionsRowItem);
        rows.push(tmpRow);
        tmpRow = [];
        count = 0;
        return;
      }
      const restSpan = mergedColumn - count;
      count += rowItem.span || 1;
      if (count >= mergedColumn) {
        if (count > mergedColumn) {
          exceed = true;
          tmpRow.push({ ...restItem, span: restSpan } as DescriptionsRowItem);
        } else {
          tmpRow.push(restItem as DescriptionsRowItem);
        }
        rows.push(tmpRow);
        tmpRow = [];
        count = 0;
      } else {
        tmpRow.push(restItem as DescriptionsRowItem);
      }
    });
  if (tmpRow.length > 0) {
    rows.push(tmpRow);
  }
  rows = rows.map((row) => {
    const sum = row.reduce((acc, item) => acc + (item.span || 1), 0);
    if (sum < mergedColumn) {
      const last = row[row.length - 1];
      if (last) {
        last.span = mergedColumn - (sum - (last.span || 1));
      }
      return row;
    }
    return row;
  });
  // 补写 index（渲染 key 用；antd 用数组下标）
  rows.forEach((row) => {
    row.forEach((item) => {
      item.index = itemIndex++;
    });
  });
  return [rows, exceed];
}
