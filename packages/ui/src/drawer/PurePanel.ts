/**
 * `PurePanel` —— antd `Drawer.tsx` 尾部的 `_InternalPanelDoNotUseOrYouWillBeFired`。
 *
 * 根类 = `{p}-drawer {p}-drawer-pure {p}-drawer-{placement}`（默认 `right`），
 * 内部直接渲染 `DrawerPanel`（**不 portal、不 mask、不 autoFocus**）。
 */
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';

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
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    footer: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    extra: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    closable: { type: [Boolean, Object, null] as unknown as PropType<unknown>, default: undefined },
    closeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    onClose: { type: Function as PropType<(e: Event) => void>, default: undefined },
    loading: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => {
      const config = useComponentConfig('drawer');
      const prefixCls = props.prefixCls || config.getPrefixCls('drawer');

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
            title: props.title,
            footer: props.footer,
            extra: props.extra,
            closable: props.closable as never,
            closeIcon: props.closeIcon,
            onClose: props.onClose,
            loading: props.loading,
          } as never,
          { default: () => slots.default?.() },
        ),
      );
    };
  },
});
