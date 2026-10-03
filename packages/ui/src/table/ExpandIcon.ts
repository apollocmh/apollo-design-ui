/**
 * antd `table/ExpandIcon.js`（24 行）—— 逐字移植。
 * `renderExpandIcon(locale)` 是**工厂**：返回 rc 的 `expandIcon` 渲染函数。
 */

import { h } from 'vue';
import { clsx } from '../notification/engine/util';
import type { TableLocale } from './interface';

export default function renderExpandIcon(locale: Partial<TableLocale>) {
  return (props: {
    prefixCls: string;
    onExpand: (record: unknown, event?: Event) => void;
    record: unknown;
    expanded: boolean;
    expandable: boolean;
  }) => {
    const { prefixCls, onExpand, record, expanded, expandable } = props;
    const iconPrefix = `${prefixCls}-row-expand-icon`;
    return h('button', {
      type: 'button',
      onClick: (e: MouseEvent) => {
        onExpand(record, e);
        e.stopPropagation();
      },
      class: clsx(iconPrefix, {
        [`${iconPrefix}-spaced`]: !expandable,
        [`${iconPrefix}-expanded`]: expandable && expanded,
        [`${iconPrefix}-collapsed`]: expandable && !expanded,
      }),
      'aria-label': expanded ? locale.collapse : locale.expand,
      'aria-expanded': expanded,
    });
  };
}
