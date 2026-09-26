/**
 * rc 侧的 `DrawerPanel` —— `@rc-component/drawer@1.4.2` `es/DrawerPanel.js` 的 Vue 版。
 *
 * ⚠️ 名字容易混：**这是 rc 的 panel**（一个 `role="dialog"` 的 `{p}-section` div），
 *    antd 自己的 `DrawerPanel.tsx`（header / body / footer 那一层）是作为 **children**
 *    传进来的。两者在渲染树里是父子关系。
 *
 * 契约（逐字）：
 *   - 根类 = `{p}-section` + 传入的 `className`；
 *   - `role="dialog"` + `aria-modal="true"`；
 *   - `pickAttrs(props, { aria: true })` 的 aria 属性先铺、`aria-modal` 固定 true、
 *     **其余 attrs 最后铺**（上游的 spread 顺序就是这个，后者能覆盖前者）；
 *   - ref 是 `panelRef`（来自 RefContext）与 `containerRef` 的**合并**。
 */
import { pickAttrs } from '@apollo-design/utils';
import { defineComponent, h, inject, type PropType } from 'vue';

import { drawerRefContextKey } from './context';

export default defineComponent({
  name: 'ADrawerSection',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    className: { type: String, default: undefined },
    /** 动效给的 ref（`CSSMotion` 的 `motionRef`）。 */
    containerRef: { type: Function as PropType<(el: unknown) => void>, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () => {
      const refContext = inject(drawerRefContextKey, {});
      const panelRef = refContext.panel;

      const mergedRef = (el: unknown): void => {
        if (typeof panelRef === 'function') (panelRef as (el: unknown) => void)(el);
        else if (panelRef && typeof panelRef === 'object' && 'value' in panelRef) {
          (panelRef as { value: unknown }).value = el;
        }
        props.containerRef?.(el);
      };

      return h(
        'div',
        {
          ...pickAttrs(attrs as Record<string, unknown>, { aria: true }),
          class: [`${props.prefixCls}-section`, props.className],
          role: 'dialog',
          'aria-modal': 'true',
          ref: mergedRef,
          ...(attrs as Record<string, unknown>),
        },
        slots.default?.(),
      );
    };
  },
});
