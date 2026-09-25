/**
 * `PureList` —— antd `components/message/PureList.tsx` 的 Vue 版。
 *
 * 一组消息的**静态**列表（不 portal、不自动关闭），用于文档/调试与 L4/L6 的静态形态。
 * 逐条对齐上游：`placement` 恒 `'top'`、`stack={false}`、每条叠加
 * `{p}-notice-{type}`（className）与 `{p}-{type}` / `{p}-notice-icon-{type}`（语义槽）。
 */
import { defineComponent, h, type PropType } from 'vue';

import { useComponentConfig } from '../config-provider/context';
import NoticeList from '../notification/engine/NoticeList';
import { getMessageIcon } from './icon';
import type { MessageSemanticType, PureListItem } from './interface';

export default defineComponent({
  name: 'AMessagePureList',
  inheritAttrs: false,
  props: {
    items: { type: Array as PropType<PureListItem[]>, default: () => [] },
    classNames: { type: Object as PropType<MessageSemanticType['classNames']>, default: undefined },
    style: { type: Object as PropType<MessageSemanticType['styles']>, default: undefined },
  },
  setup(props) {
    return () => {
      const config = useComponentConfig('message');
      const prefixCls = config.getPrefixCls('message');
      const noticePrefixCls = `${prefixCls}-notice`;

      const configList = props.items.map((item) => {
        const { content, duration, key, type } = item;
        const typeIconCls = type ? `${noticePrefixCls}-icon-${type}` : undefined;
        return {
          key,
          duration,
          icon: getMessageIcon(type),
          title: content,
          className: `${noticePrefixCls}-${type}`,
          classNames: {
            wrapper: `${prefixCls}-${type}`,
            icon: typeIconCls,
          },
        };
      });

      return h(NoticeList, {
        prefixCls,
        placement: 'top',
        configList,
        className: props.classNames?.root,
        classNames: {
          list: props.classNames?.list,
          listContent: props.classNames?.listContent,
          wrapper: props.classNames?.wrapper,
          title: props.classNames?.title,
        },
        style: props.style?.list,
        stack: false,
      } as never);
    };
  },
});
