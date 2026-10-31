import { isEmptyVNode } from '@apollo-design/utils';
import { defineComponent, h, mergeProps, type PropType, type SlotsType } from 'vue';
import { clsx } from '../_internal/clsx';
import { mergeClassNames, mergeStyles } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import Notice from '../notification/engine/Notice';
import { useMessageTheme } from '../notification/use-notice-theme';
import { getMessageIcon } from './icon';
import type {
  ConfigOptions,
  MessagePurePanelProps,
  MessagePurePanelSlots,
  NoticeType,
} from './interface';

export default defineComponent({
  name: 'AMessagePurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    type: { type: String as PropType<NoticeType>, default: undefined },
    content: { type: String, default: undefined },
    classNames: {
      type: Object as PropType<MessagePurePanelProps['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<MessagePurePanelProps['styles']>, default: undefined },
  },
  slots: {} as SlotsType<MessagePurePanelSlots>,
  emits: { click: (_event: MouseEvent) => true },
  setup(props, { attrs, slots, emit }) {
    const config = useComponentConfig<
      ConfigOptions & { className?: string; style?: import('vue').CSSProperties }
    >('message');
    const theme = useMessageTheme();
    return () => {
      const prefixCls = props.prefixCls ?? config.getPrefixCls('message');
      const noticePrefixCls = `${prefixCls}-notice`;
      const cn = mergeClassNames(config.classNames, props.classNames);
      const st = mergeStyles(config.styles, props.styles);
      const content = slots.content ? slots.content() : props.content;
      const icon = slots.icon?.();
      return h(
        'div',
        mergeProps(
          {
            class: [`${noticePrefixCls}-pure-panel`, config.className, cn.root],
            style: [theme.style.value, config.style, st.root],
            onClick: (event: MouseEvent) => emit('click', event),
          },
          attrs,
        ),
        [
          h(Notice, {
            prefixCls,
            duration: null,
            title: content,
            icon: getMessageIcon(props.type, slots.icon && isEmptyVNode(icon) ? null : icon),
            classNames: {
              wrapper: clsx(props.type ? `${prefixCls}-${props.type}` : undefined, cn.wrapper),
              icon: clsx(props.type ? `${noticePrefixCls}-icon-${props.type}` : undefined, cn.icon),
              title: cn.title,
            },
            styles: { wrapper: st.wrapper, icon: st.icon, title: st.title },
          }),
        ],
      );
    };
  },
});
