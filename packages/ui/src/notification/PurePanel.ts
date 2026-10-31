import { useLocale } from '@apollo-design/locale';
import { isEmptyVNode } from '@apollo-design/utils';
import { defineComponent, h, mergeProps, type PropType, type SlotsType } from 'vue';
import { computeClosable } from '../_internal/use-closable';
import { mergeClassNames, mergeStyles } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import Notice from './engine/Notice';
import { getCloseIcon, getCloseIconWithLabel, TypeIcon } from './icon';
import type {
  IconType,
  NotificationConfig,
  NotificationPurePanelProps,
  NotificationPurePanelSlots,
} from './interface';
import { useNotificationTheme } from './use-notice-theme';

export default defineComponent({
  name: 'ANotificationPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    message: { type: String, default: undefined },
    title: { type: String, default: undefined },
    description: { type: String, default: undefined },
    type: { type: String as PropType<IconType>, default: undefined },
    role: { type: String as PropType<'alert' | 'status'>, default: undefined },
    closable: {
      type: [Boolean, Object] as PropType<NotificationPurePanelProps['closable']>,
      default: undefined,
    },
    classNames: {
      type: Object as PropType<NotificationPurePanelProps['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<NotificationPurePanelProps['styles']>, default: undefined },
  },
  slots: {} as SlotsType<NotificationPurePanelSlots>,
  emits: { click: (_event: MouseEvent) => true, close: () => true },
  setup(props, { attrs, slots, emit }) {
    const config = useComponentConfig<
      Omit<NotificationConfig, 'closable'> &
        Pick<NotificationPurePanelProps, 'closable'> & {
          className?: string;
          style?: import('vue').CSSProperties;
        }
    >('notification');
    const [locale] = useLocale('global');
    const theme = useNotificationTheme();
    return () => {
      const prefixCls = props.prefixCls ?? config.getPrefixCls('notification');
      const noticePrefixCls = `${prefixCls}-notice`;
      const cn = mergeClassNames(config.classNames, props.classNames);
      const st = mergeStyles(config.styles, props.styles);
      const title = slots.title
        ? slots.title()
        : slots.message
          ? slots.message()
          : (props.title ?? props.message);
      const icon = slots.icon ? slots.icon() : props.type ? h(TypeIcon[props.type]) : null;
      const closeIcon = slots.closeIcon?.();
      const closeLabel = locale.value.close ?? 'Close';
      const closable = computeClosable(
        {
          closable: props.closable,
          closeIcon: slots.closeIcon && isEmptyVNode(closeIcon) ? null : closeIcon,
        },
        { closable: config.closable, closeIcon: config.closeIcon },
        {
          closable: true,
          closeLabel,
          closeIcon: getCloseIcon(prefixCls),
          closeIconRender: (node) => getCloseIconWithLabel(prefixCls, node, closeLabel),
        },
      );
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
            role: props.role,
            title: isEmptyVNode(title) ? null : title,
            description: slots.description ? slots.description() : props.description,
            actions: slots.actions ? slots.actions() : slots.btn?.(),
            icon,
            closable: closable.closable
              ? {
                  closeIcon: closable.closeIconNode,
                  disabled: closable.closeBtnIsDisabled,
                  ...closable.ariaProps,
                }
              : false,
            onClose: () => emit('close'),
            classNames: {
              ...cn,
              root: undefined,
              icon: [
                !slots.icon && props.type ? `${noticePrefixCls}-icon-${props.type}` : undefined,
                cn.icon,
              ]
                .filter(Boolean)
                .join(' '),
            },
            styles: { ...st, root: undefined },
          }),
        ],
      );
    };
  },
});
