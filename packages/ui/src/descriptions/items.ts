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
 * 取组件 vnode 的**默认插槽**内容（Issue #31.1）。
 *
 * ⚠️ Vue 的 `Descriptions.Item` 是「语法糖组件」：正文写在**默认插槽**里，落在
 *    `vnode.children` 的 **`{ default: fn }` 插槽对象**上，而**不在** `vnode.props`
 *    里（React 的 JSX children 才是 props.children）。原来只读 props ⇒ 标签出现、
 *    **正文丢失**。
 * ⚠️ 只对「组件 vnode」这么读：元素 vnode 的 `children` 是子节点（string / 数组），
 *    不是插槽对象。
 */
function readDefaultSlotChildren(vnode: VNode): VNodeChild | undefined {
  const raw = vnode.children as unknown;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const slot = (raw as { default?: unknown }).default;
  if (typeof slot !== 'function') return undefined;
  return (slot as (...args: unknown[]) => VNodeChild)();
}

/**
 * children → items（`transChildren2Items`）：读每个 vnode 的 props（Item 语法糖）
 * + key + **默认插槽正文**。Comment 摊平剔除、Fragment 摊平。
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
      const props = (v.props ?? {}) as DescriptionsItemType;
      const slotChildren = readDefaultSlotChildren(v);
      out.push({
        ...props,
        // 显式 `children` prop 优先，否则用默认插槽（语法糖的正文）
        children: props.children ?? slotChildren,
        key: (v.key as string | number) ?? props.key,
      });
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
      // ⚠️ 必须 **带上 `filled: true`**（去掉 span 即可）—— `getCalcRows` 靠这个
      //    标记「推入当前行后立刻收行」；原来只 `return rest` ⇒ filled 退化成普通
      //    span=1，跨行语义丢失（Issue #31.2）。
      return { ...rest, filled: true } as Omit<DescriptionsRowItem, 'index'> & { span?: number };
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
