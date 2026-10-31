import { defineComponent, h, mergeProps, normalizeStyle, type PropType } from 'vue';
import { mergeClassNames, mergeStyles } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import NoticeList from '../notification/engine/NoticeList';
import { provideNoticeZIndex, useMessageTheme } from '../notification/use-notice-theme';
import { getMessageIcon } from './icon';
import type { ConfigOptions, MessageSemanticType, PureListItem } from './interface';

export default defineComponent({
  name: 'AMessagePureList',
  inheritAttrs: false,
  props: {
    items: { type: Array as PropType<PureListItem[]>, default: () => [] },
    classNames: { type: Object as PropType<MessageSemanticType['classNames']>, default: undefined },
    styles: { type: Object as PropType<MessageSemanticType['styles']>, default: undefined },
  },
  setup(props, { attrs }) {
    const config = useComponentConfig<
      ConfigOptions & { className?: string; style?: import('vue').CSSProperties }
    >('message');
    const theme = useMessageTheme();
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
      const prefixCls = config.getPrefixCls('message');
      const cn = mergeClassNames(config.classNames, props.classNames);
      const st = mergeStyles(config.styles, props.styles);
      const configList = props.items.map((item) => ({
        key: item.key,
        duration: item.duration,
        title: item.content,
        icon: getMessageIcon(item.type),
        className: `${prefixCls}-notice-${item.type}`,
        classNames: {
          wrapper: `${prefixCls}-${item.type}`,
          icon: `${prefixCls}-notice-icon-${item.type}`,
        },
      }));
      const native = mergeProps(
        { class: config.className, style: [theme.style.value, config.style] },
        attrs,
      );
      const listProps = {
        ...native,
        prefixCls,
        placement: 'top',
        configList,
        classNames: cn,
        styles: st,
        stack: false,
      } satisfies InstanceType<typeof NoticeList>['$props'];
      return h(NoticeList, listProps);
    };
  },
});
