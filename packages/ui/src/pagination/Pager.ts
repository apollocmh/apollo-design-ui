/**
 * `Pager` —— rc-pagination `Pager.js`（41 行）的 Vue 等价物。
 *
 * DOM（逐字）：
 * ```
 * li.{p}-item.{p}-item-{n}[-active][-disabled][-item-after-jump-prev|-item-before-jump-next]
 *   > {itemRender(page, 'page', <a rel="nofollow">{page}</a>)}
 * ```
 * 可用页码支持 Enter 激活；禁用项不参与 Tab 顺序，并以 aria-disabled 表明状态。
 */

import { isEmptyVNode } from '@apollo-design/utils';
import type { CSSProperties, SlotsType } from 'vue';
import { defineComponent, h, type PropType } from 'vue';
import type { PaginationSlots } from './interface';

const contentSlots: SlotsType<{ default?: PaginationSlots['itemRender'] }> = {};

export default defineComponent({
  name: 'APaginationPager',
  slots: contentSlots,
  props: {
    rootPrefixCls: { type: String, required: true },
    page: { type: Number, required: true },
    active: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    /** 语义槽 `item` 的类名（antd 传给每个 li）。 */
    itemClassName: { type: String, default: undefined },
    itemStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    /** 跳页项相邻的补类。 */
    extraClass: { type: String, default: undefined },
    showTitle: { type: Boolean, default: true },
  },
  emits: { select: (_page: number) => true },
  setup(props, { slots, emit }) {
    return () => {
      const prefixCls = `${props.rootPrefixCls}-item`;
      const className = [
        prefixCls,
        `${prefixCls}-${props.page}`,
        props.active ? `${prefixCls}-active` : '',
        !props.page ? `${prefixCls}-disabled` : '',
        props.extraClass ? `${props.rootPrefixCls}-${props.extraClass}` : '',
        props.itemClassName,
      ]
        .filter(Boolean)
        .join(' ');

      const handleClick = (): void => {
        if (!props.disabled) emit('select', props.page);
      };
      const handleKeydown = (e: KeyboardEvent): void => {
        if (e.defaultPrevented) return;
        if (e.key === 'Enter' || e.charCode === 13 || e.keyCode === 13) {
          e.preventDefault();
          handleClick();
        }
      };

      const anchor = h('a', { rel: 'nofollow' }, String(props.page));
      const content = slots.default
        ? slots.default({ page: props.page, type: 'page', element: anchor })
        : anchor;

      if (isEmptyVNode(content)) return null;

      return h(
        'li',
        {
          title: props.showTitle ? String(props.page) : undefined,
          class: className,
          style: props.itemStyle,
          onClick: handleClick,
          onKeydown: handleKeydown,
          tabIndex: props.disabled ? undefined : 0,
          'aria-disabled': props.disabled || undefined,
        },
        [content],
      );
    };
  },
});
