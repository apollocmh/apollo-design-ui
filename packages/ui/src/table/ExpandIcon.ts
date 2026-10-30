/**
 * 展开图标工厂，参考 antd `table/ExpandIcon.js`。
 * 不可展开行使用隐藏的装饰节点保留对齐。
 */

import { h } from 'vue';
import { clsx } from '../_internal/clsx';
import type { RenderExpandIcon, TableLocale } from './interface';

export default function renderExpandIcon<RecordType>(
  locale: Partial<TableLocale>,
): RenderExpandIcon<RecordType> {
  return (props) => {
    const { prefixCls, onExpand, record, expanded, expandable } = props;
    const iconPrefix = `${prefixCls}-row-expand-icon`;
    if (!expandable)
      return h('span', { class: [iconPrefix, `${iconPrefix}-spaced`], 'aria-hidden': 'true' });

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
