/**
 * Static Drawer content without Portal, mask, focus or resize effects.
 * Historical reference: antd 6.6.4 components/drawer/Drawer.tsx PurePanel.
 */
import { isEmptyVNode } from '@apollo-design/utils';
import {
  type CSSProperties,
  defineComponent,
  h,
  type PropType,
  type SlotsType,
  type VNodeChild,
} from 'vue';
import { mergeClassNames, mergeStyles } from '../_internal/use-merge-semantic';
import { type ComponentStyleConfig, useComponentConfig } from '../config-provider/context';
import DrawerPanel from './DrawerPanel';
import type { DrawerClosable, DrawerPlacement, DrawerSemanticType, DrawerSlots } from './interface';
import { useDrawerTheme } from './use-drawer-theme';

const contentSlots: SlotsType<DrawerSlots> = {};

export default defineComponent({
  name: 'ADrawerPurePanel',
  inheritAttrs: false,
  slots: contentSlots,
  props: {
    prefixCls: { type: String, default: undefined },
    placement: { type: String as PropType<DrawerPlacement>, default: 'right' },
    title: { type: String, default: undefined },
    closable: { type: [Boolean, Object] as PropType<DrawerClosable>, default: undefined },
    loading: { type: Boolean, default: false },
    classNames: { type: Object as PropType<DrawerSemanticType['classNames']>, default: undefined },
    styles: { type: Object as PropType<DrawerSemanticType['styles']>, default: undefined },
    headerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    bodyStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    footerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  },
  emits: { close: (_event: Event) => true },
  setup(props, { attrs, slots, emit }) {
    const readSlot = (name: keyof DrawerSlots): VNodeChild => {
      const slot = slots[name];
      if (!slot) return undefined;
      const nodes = slot();
      return isEmptyVNode(nodes) ? null : nodes;
    };
    const config = useComponentConfig<DrawerSemanticType & ComponentStyleConfig>('drawer');
    const theme = useDrawerTheme();
    return () => {
      const prefix = props.prefixCls || config.getPrefixCls('drawer');
      const cn = mergeClassNames(config.classNames, props.classNames);
      const st = mergeStyles(config.styles, props.styles);
      return h(
        'div',
        {
          ...attrs,
          class: [
            prefix,
            `${prefix}-pure`,
            `${prefix}-${props.placement}`,
            config.className,
            cn.content,
            cn.section,
            cn.root,
            attrs.class,
            config.direction === 'rtl' && `${prefix}-rtl`,
          ],
          style: [theme.style.value, config.style, st.content, st.section, st.root, attrs.style],
        },
        h(
          DrawerPanel,
          {
            prefixCls: prefix,
            title: slots.title ? readSlot('title') : props.title,
            footer: readSlot('footer'),
            extra: readSlot('extra'),
            closable: props.closable,
            closeIcon: readSlot('closeIcon'),
            onClose: (event) => emit('close', event),
            loading: props.loading,
            classNames: cn,
            styles: st,
            headerStyle: props.headerStyle,
            bodyStyle: props.bodyStyle,
            footerStyle: props.footerStyle,
          },
          { default: () => slots.default?.() },
        ),
      );
    };
  },
});
