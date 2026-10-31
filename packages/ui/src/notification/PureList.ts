import { defineComponent, h, mergeProps, normalizeStyle, type PropType } from 'vue';
import { mergeClassNames, mergeStyles } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import NoticeList from './engine/NoticeList';
import { getCloseIcon, TypeIcon } from './icon';
import type {
  NotificationConfig,
  NotificationPlacement,
  NotificationSemanticType,
  PureListItem,
} from './interface';
import { provideNoticeZIndex, useNotificationTheme } from './use-notice-theme';

export type { PureListItem } from './interface';

export default defineComponent({
  name: 'ANotificationPureList',
  inheritAttrs: false,
  props: {
    items: { type: Array as PropType<PureListItem[]>, default: () => [] },
    placement: { type: String as PropType<NotificationPlacement>, default: 'topRight' },
    classNames: {
      type: Object as PropType<NotificationSemanticType['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<NotificationSemanticType['styles']>, default: undefined },
  },
  setup(props, { attrs }) {
    const config = useComponentConfig<
      NotificationConfig & { className?: string; style?: import('vue').CSSProperties }
    >('notification');
    const theme = useNotificationTheme();
    provideNoticeZIndex(
      () => theme.token.value.zIndexPopup,
      () => {
        const style = normalizeStyle(mergeProps({ style: config.style }, attrs).style);
        return (
          (typeof style === 'object' ? (style.zIndex ?? style['z-index']) : undefined) ??
          props.styles?.list?.zIndex ??
          config.styles?.list?.zIndex
        );
      },
    );
    return () => {
      const prefixCls = config.getPrefixCls('notification');
      const cn = mergeClassNames(config.classNames, props.classNames);
      const st = mergeStyles(config.styles, props.styles);
      const configList = props.items.map((item) => ({
        ...item,
        closable: { closeIcon: getCloseIcon(`${prefixCls}-notice`) },
        icon: item.type ? h(TypeIcon[item.type]) : null,
        className: item.type ? `${prefixCls}-notice-${item.type}` : undefined,
        classNames: { icon: item.type ? `${prefixCls}-notice-icon-${item.type}` : undefined },
      }));
      const native = mergeProps(
        { class: config.className, style: [theme.style.value, config.style] },
        attrs,
      );
      const listProps = {
        ...native,
        prefixCls,
        placement: props.placement,
        configList,
        classNames: cn,
        styles: st,
        stack: false,
      } satisfies InstanceType<typeof NoticeList>['$props'];
      return h(NoticeList, listProps);
    };
  },
});
