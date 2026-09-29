/**
 * 「新增页签」按钮（rc `TabNavList/AddButton.js` 的等价物）。
 *
 * ```
 * button.{p}-nav-add[type=button][aria-label=locale.addAriaLabel || 'Add tab']  → editable.addIcon || '+'
 * ```
 *
 * ⚠️ `editable.showAdd === false`（来自 antd 壳的 `hideAdd`）时**整个按钮不渲染**，
 *    而 `style` 仍然由父组件传进来 —— 父组件负责「有下拉时 `visibility: hidden`」
 *    （不是 `display: none`，因为要**占位**，否则测量会抖动）。
 */

import { defineComponent, h, type PropType } from 'vue';
import type { TabsEditableConfig } from './interface';

export default defineComponent({
  name: 'ATabsAddButton',
  props: {
    prefixCls: { type: String, required: true },
    editable: { type: Object as PropType<TabsEditableConfig | undefined>, default: undefined },
    locale: { type: Object as PropType<{ addAriaLabel?: string } | undefined>, default: undefined },
    style: { type: Object as PropType<Record<string, unknown> | undefined>, default: undefined },
  },
  setup(props, { expose }) {
    const buttonRef = { value: null as HTMLElement | null };
    expose({ getElement: (): HTMLElement | null => buttonRef.value });

    return () => {
      const { prefixCls, editable, locale } = props;
      if (!editable || editable.showAdd === false) return null;

      return h(
        'button',
        {
          ref: (el: unknown) => {
            buttonRef.value = (el as HTMLElement | null) ?? null;
          },
          type: 'button',
          class: `${prefixCls}-nav-add`,
          style: props.style,
          'aria-label': locale?.addAriaLabel || 'Add tab',
          onClick: (event: MouseEvent) => {
            editable.onEdit('add', { event });
          },
        },
        editable.addIcon || '+',
      );
    };
  },
});
