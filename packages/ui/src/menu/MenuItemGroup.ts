/**
 * MenuItemGroup —— rc-menu `MenuItemGroup.js` 的 Vue 版。
 * measure 模式 ⇒ 只递归渲染子节点（不渲染 group 本体，供路径登记）。
 */
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';

import { useMeasure, useMenuContext } from './context';
import type { ItemType } from './interface';

const MenuItemGroup = defineComponent({
  name: 'AMenuItemGroup',
  props: {
    eventKey: { type: String, default: undefined },
    label: { type: [Object, String, Number] as PropType<VNodeChild>, default: undefined },
    overflowCls: { type: String, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const measure = useMeasure();

    if (measure) {
      // rc MenuItemGroup 的 measure 分支直接返回 childList，且**不登记自身路径**
      // （group 不是可导航节点）。返回 null 会让组内子项从 key→keyPath 表中消失，
      // 选中态 / getSubPathKeys / 键盘导航全部失效。
      return () => slots.default?.() ?? null;
    }

    const ctx = useMenuContext();
    const groupPrefixCls = `${ctx.prefixCls}-item-group`;

    return () =>
      h(
        'li',
        {
          ...attrs,
          role: 'presentation',
          onClick: (e: MouseEvent) => e.stopPropagation(),
          class: [groupPrefixCls, props.overflowCls, attrs.class],
        },
        [
          h(
            'div',
            {
              role: 'presentation',
              class: `${groupPrefixCls}-title`,
              title: typeof props.label === 'string' ? props.label : undefined,
            },
            props.label ?? slots.default?.(),
          ),
          h('ul', { role: 'group', class: `${groupPrefixCls}-list` }, slots.default?.()),
        ],
      );
  },
});

export default MenuItemGroup;
export type { ItemType };
