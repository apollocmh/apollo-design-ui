/**
 * `PurePanel` —— antd `Drawer.tsx` 尾部的 `_InternalPanelDoNotUseOrYouWillBeFired`。
 *
 * 根类 = `{p}-drawer {p}-drawer-pure {p}-drawer-{placement}`（默认 `right`），
 * 内部直接渲染 `DrawerPanel`（**不 portal、不 mask、不 autoFocus**）。
 */

import { isEmptyVNode } from '@apollo-design/utils';
import { defineComponent, h, type PropType } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import DrawerPanel from './DrawerPanel';
import type { DrawerPlacement } from './interface';

export default defineComponent({
  name: 'ADrawerPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    placement: { type: String as PropType<DrawerPlacement>, default: 'right' },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    className: { type: String, default: undefined },
    // ⚠️ C8-R2：原 `footer` / `extra` / `closeIcon` 删除改为同名 slot（slot 在前，空 slot
    //    等价隐藏）；`title` 收窄为 String（富标题走 `#title` slot，slot 优先）。
    title: { type: String, default: undefined },
    closable: { type: [Boolean, Object, null] as unknown as PropType<unknown>, default: undefined },
    onClose: { type: Function as PropType<(e: Event) => void>, default: undefined },
    loading: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    // ============ slot：ReactNode / render prop 的唯一入口（规则 C8-R2）============
    const readSlot = (name: string): unknown => {
      const fn = (slots as Record<string, unknown>)[name];
      if (typeof fn !== 'function') return undefined;
      const nodes = (fn as (...args: unknown[]) => unknown)();
      if (nodes === undefined) return undefined;
      return isEmptyVNode(nodes) ? null : nodes;
    };

    return () => {
      const config = useComponentConfig('drawer');
      const prefixCls = props.prefixCls || config.getPrefixCls('drawer');

      const titleSlot = readSlot('title');
      const mergedTitle: unknown = titleSlot !== undefined ? titleSlot : props.title;

      return h(
        'div',
        {
          class: [
            prefixCls,
            `${prefixCls}-pure`,
            `${prefixCls}-${props.placement}`,
            props.className,
          ],
          style: props.style,
        },
        h(
          DrawerPanel,
          {
            prefixCls,
            title: mergedTitle as never,
            footer: readSlot('footer') as never,
            extra: readSlot('extra') as never,
            closable: props.closable as never,
            closeIcon: readSlot('closeIcon') as never,
            onClose: props.onClose,
            loading: props.loading,
          } as never,
          { default: () => slots.default?.() },
        ),
      );
    };
  },
});
