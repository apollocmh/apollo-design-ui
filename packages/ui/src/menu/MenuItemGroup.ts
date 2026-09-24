/**
 * MenuItemGroup —— rc-menu `MenuItemGroup.js` 的 Vue 版。
 * measure 模式 ⇒ 只递归渲染子节点（不渲染 group 本体，供路径登记）。
 */
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';

import { useFullPath, useMeasure, useMenuContext } from './context';
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
    const connectedKeyPath = useFullPath(props.eventKey);

    if (measure) {
      // rc：measure 模式只返回 childList（children 由 Menu 以规范节点另行渲染）
      measure.registerPath(props.eventKey ?? '', connectedKeyPath.value);
      return () => null;
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
