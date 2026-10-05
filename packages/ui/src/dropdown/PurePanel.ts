/**
 * PurePanel —— antd `genPurePanel(Dropdown, ...)` 的 Vue 版。
 * `_InternalPanelDoNotUseOrYouWillBeFired` 静态面板（demo / 文档用）：
 * 直接渲染 `{p}-dropdown` 根 + Menu（override 覆盖，无 Trigger/portal）。
 */
import { defineComponent, h, type PropType, provide, type VNodeChild } from 'vue';

import { menuOverrideKey } from '../menu/context';
import Menu from '../menu/Menu';
import type { DropdownProps } from './interface';

type StyleLike = Record<string, string | number>;

/** OverrideProvider 的 Vue 对应物（provide 必须在 setup 顶层 ⇒ 独立组件）。 */
const OverrideProvider = defineComponent({
  name: 'ADropdownPureOverride',
  props: {
    override: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(props, { slots }) {
    provide(menuOverrideKey, props.override as never);
    return () => slots.default?.();
  },
});

const PurePanel = defineComponent({
  name: 'ADropdownPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    menu: { type: Object as PropType<DropdownProps['menu']>, default: undefined },
    classNames: { type: Object as PropType<DropdownProps['classNames']>, default: undefined },
    styles: { type: Object as PropType<DropdownProps['styles']>, default: undefined },
  },
  setup(props, { attrs }) {
    return () => {
      const prefixCls = props.prefixCls ?? 'apollo-dropdown';
      const override = {
        prefixCls: `${prefixCls}-menu`,
        mode: 'vertical' as const,
        selectable: false,
      };
      const restAttrs = Object.fromEntries(
        Object.entries(attrs).filter(([k]) => k !== 'class' && k !== 'style'),
      );
      return h(
        'div',
        {
          ...restAttrs,
          // 根 `class` / `style` 是 Vue 原生 attrs（`attrs.class` 已在数组里）。
          class: [prefixCls, props.classNames?.root, attrs.class],
          style: {
            ...(props.styles?.root ?? {}),
            ...((attrs.style as StyleLike | undefined) ?? {}),
          },
        },
        h(OverrideProvider, { override }, () =>
          props.menu?.items
            ? h(Menu, { ...(props.menu as object), prefixCls: `${prefixCls}-menu` } as never)
            : ([props.menu as unknown as VNodeChild].filter(
                (c) => c !== null && c !== undefined,
              ) as VNodeChild),
        ),
      );
    };
  },
});

export default PurePanel;
