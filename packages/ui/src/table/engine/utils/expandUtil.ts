/**
 * `@rc-component/table@1.11.1` 的 `es/utils/expandUtil.js`（46 行）—— **逐字移植**。
 *
 * 三个导出都是**纯函数 / 纯渲染**，没有 state ⇒ L1 可直测。
 */

import { h, type VNode } from 'vue';

export interface RenderExpandIconParams<RecordType> {
  prefixCls: string;
  record: RecordType;
  onExpand: (record: RecordType, event: Event) => void;
  expanded: boolean;
  /** 该行是否可展开（`rowExpandable` 的产物）。 */
  expandable: boolean;
}

/**
 * 默认的展开图标（`<span>`，**不是 button**）。
 *
 * 判据（逐字）：
 *  1. 不可展开 ⇒ 只渲染一个占位 `<span>`，类名 `-row-expand-icon -row-spaced`（**不绑事件**）；
 *  2. 可展开 ⇒ 类名带 `-row-expanded` / `-row-collapsed` 之一；
 *  3. 点击**先调 `onExpand`，再 `stopPropagation()`** —— 顺序是契约
 *     （`expandRowByClick` 时行的 onClick 也会展开，靠这一步避免「展开两次」）。
 *
 * ⚠️ 上游返回的是 React 元素；本仓返回 **VNode**。调用点（`Cell` 的 `appendCellNode`）直接放进 children。
 */
export function renderExpandIcon<RecordType>(params: RenderExpandIconParams<RecordType>): VNode {
  const { prefixCls, record, onExpand, expanded, expandable } = params;
  const expandClassName = `${prefixCls}-row-expand-icon`;

  if (!expandable) {
    return h('span', { class: [expandClassName, `${prefixCls}-row-spaced`] });
  }

  return h('span', {
    class: [
      expandClassName,
      {
        [`${prefixCls}-row-expanded`]: expanded,
        [`${prefixCls}-row-collapsed`]: !expanded,
      },
    ],
    onClick: (event: Event) => {
      onExpand(record, event);
      event.stopPropagation();
    },
  });
}

/**
 * 递归收集**整棵树的全部 rowKey**（树形数据用）。
 *
 * 判据（逐字）：先 push 自己，再下钻 `item[childrenColumnName]`；`children` 缺失时
 * `dig(undefined)` 走 `(list || [])` ⇒ 安全。
 * ⚠️ `index` 是**同一层内**的索引（不是全局），会原样传给 `getRowKey`。
 */
export function findAllChildrenKeys<RecordType>(
  data: readonly RecordType[] | undefined,
  getRowKey: (record: RecordType, index: number) => string | number,
  childrenColumnName: string,
): (string | number)[] {
  const keys: (string | number)[] = [];

  function dig(list: readonly RecordType[] | undefined): void {
    (list || []).forEach((item, index) => {
      keys.push(getRowKey(item, index));
      dig((item as Record<string, RecordType[]>)[childrenColumnName]);
    });
  }

  dig(data);
  return keys;
}

/**
 * 行类名的三形态求值：`string` 原样 / `function` 调用 / 其余 ⇒ `''`。
 *
 * ⚠️ 上游返回的是 `string | undefined`（函数返回值直接透传），本仓同理。
 */
export function computedExpandedClassName<RecordType>(
  cls: string | ((record: RecordType, index: number, indent: number) => string) | undefined,
  record: RecordType,
  index: number,
  indent: number,
): string {
  if (typeof cls === 'string') {
    return cls;
  }
  if (typeof cls === 'function') {
    return cls(record, index, indent);
  }
  return '';
}
