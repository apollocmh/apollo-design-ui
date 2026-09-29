/**
 * `Pager` —— rc-pagination `Pager.js`（41 行）的 Vue 等价物。
 *
 * DOM（逐字）：
 * ```
 * li.{p}-item.{p}-item-{n}[-active][-disabled][-item-after-jump-prev|-item-before-jump-next]
 *   > {itemRender(page, 'page', <a rel="nofollow">{page}</a>)}
 * ```
 * ⚠️ `tabIndex` 恒为 `0`（rc 在 Pager 里写死；`-disabled` 只是视觉与 `disabled` 类），
 *    与 `prev` / `next` 的 `tabIndex = 可用 ? 0 : null` **不同**。
 */

import type { CSSProperties } from 'vue';
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';

export default defineComponent({
  name: 'APaginationPager',
  props: {
    rootPrefixCls: { type: String, required: true },
    page: { type: Number, required: true },
    active: { type: Boolean, default: false },
    /** 语义槽 `item` 的类名（antd 传给每个 li）。 */
    itemClassName: { type: String, default: undefined },
    itemStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    /** 跳页项相邻的补类。 */
    extraClass: { type: String, default: undefined },
    showTitle: { type: Boolean, default: true },
    onClick: { type: Function as PropType<(page: number) => void>, default: undefined },
    onKeydown: {
      type: Function as PropType<
        (e: KeyboardEvent, cb: (page: number) => void, page: number) => void
      >,
      default: undefined,
    },
    itemRender: {
      type: Function as PropType<(page: number, type: 'page', element: VNodeChild) => VNodeChild>,
      default: undefined,
    },
  },
  setup(props) {
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

      const handleClick = (): void => props.onClick?.(props.page);
      const handleKeydown = (e: KeyboardEvent): void => {
        props.onKeydown?.(e, (page: number) => props.onClick?.(page), props.page);
      };

      const anchor = h('a', { rel: 'nofollow' }, String(props.page));
      const content = props.itemRender ? props.itemRender(props.page, 'page', anchor) : anchor;

      if (!content) return null;

      return h(
        'li',
        {
          title: props.showTitle ? String(props.page) : undefined,
          class: className,
          style: props.itemStyle,
          onClick: handleClick,
          onKeydown: handleKeydown,
          tabIndex: 0,
        },
        [content],
      );
    };
  },
});
