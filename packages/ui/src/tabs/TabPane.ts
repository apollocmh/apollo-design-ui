/**
 * 单个面板（rc `TabPanelList/TabPane.js` 的等价物）。
 *
 * ```
 * div.{contentCls}[-active][className][style][id={id}-panel-{key}]
 *    [role=tabpanel][tabindex: active && hasContent ? 0 : -1]
 *    [aria-labelledby={id}-tab-{key}][aria-hidden=!active]
 * ```
 *
 * ⚠️ `tabIndex` 的判据是 **`active && hasContent`** —— `hasContent` 是
 *    `Children.count(children) > 0`（**子节点个数**，不是「非空字符串」）。
 *    空的 `children`（`undefined` / `''` / `[]`）⇒ `-1`。
 *
 * ⚠️ `aria-hidden={!active}` —— 未激活面板即使被 `forceRender` 渲染出来也是隐藏语义。
 */

import type { CSSProperties } from 'vue';
import { computed, defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { getPanelId, getTabId } from './util';

export default defineComponent({
  name: 'ATabPane',
  props: {
    prefixCls: { type: String, required: true },
    className: { type: String as PropType<string | undefined>, default: undefined },
    style: { type: Object as PropType<CSSProperties | undefined>, default: undefined },
    id: { type: String as PropType<string | undefined>, default: undefined },
    active: { type: Boolean, default: false },
    tabKey: { type: String, required: true },
    children: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  },
  setup(props) {
    const hasContent = computed(() => {
      const children = props.children;
      if (children === undefined || children === null || children === false) return false;
      if (Array.isArray(children))
        return children.some(
          (child) => child !== undefined && child !== null && child !== false && child !== '',
        );
      return children !== '';
    });

    return () =>
      h(
        'div',
        {
          id: props.id ? getPanelId(props.id, props.tabKey) : undefined,
          role: 'tabpanel',
          tabIndex: props.active && hasContent.value ? 0 : -1,
          'aria-labelledby': props.id ? getTabId(props.id, props.tabKey) : undefined,
          'aria-hidden': !props.active,
          style: props.style,
          class: [
            props.prefixCls,
            props.active ? `${props.prefixCls}-active` : undefined,
            props.className,
          ]
            .filter(Boolean)
            .join(' '),
        },
        props.children === undefined || props.children === null ? undefined : [props.children],
      );
  },
});
