/**
 * MenuDivider —— rc-menu `Divider.js` 的 Vue 版。
 * measure 模式 ⇒ null（divider 无路径）。
 */
import { defineComponent, h } from 'vue';

import { useMeasure, useMenuContext } from './context';

const MenuDivider = defineComponent({
  name: 'AMenuDivider',
  props: {
    eventKey: { type: String, default: undefined },
    dashed: { type: Boolean, default: false },
  },
  setup(props, { attrs }) {
    const measure = useMeasure();
    if (measure) {
      return () => null;
    }
    const ctx = useMenuContext();
    return () =>
      h('li', {
        ...attrs,
        role: 'separator',
        class: [
          `${ctx.prefixCls}-item-divider`,
          props.dashed ? `${ctx.prefixCls}-item-divider-dashed` : undefined,
          attrs.class,
        ],
      });
  },
});

export default MenuDivider;
