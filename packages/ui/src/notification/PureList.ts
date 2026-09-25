/**
 * `PureList` —— antd `components/notification/PureList.tsx` 的 Vue 版。
 *
 * 一组通知的**静态**列表（不 portal、不自动关闭）。逐条对齐上游：
 *   - `placement` 默认 `'topRight'`（可传）；
 *   - `stack` 恒 `false`（静态列表不折叠）；
 *   - 每条：`closable.closeIcon` 用 **notice 前缀**（`{p}-notification-notice`）的
 *     `getCloseIcon`，`className` 叠加 `{p}-notice-{type}`，语义槽只叠 `icon`。
 */
import { defineComponent, h, type PropType } from 'vue';

import { useComponentConfig } from '../config-provider/context';
import NoticeList from './engine/NoticeList';
import { getCloseIcon, TypeIcon } from './icon';
import type { NotificationPlacement, NotificationSemanticType } from './interface';

export interface PureListItem {
  key: string | number;
  title?: unknown;
  description?: unknown;
  type?: 'success' | 'info' | 'error' | 'warning';
  actions?: unknown;
  duration?: number | false;
  showProgress?: boolean;
}

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
    style: { type: Object as PropType<NotificationSemanticType['styles']>, default: undefined },
  },
  setup(props) {
    return () => {
      const config = useComponentConfig('notification');
      const prefixCls = config.getPrefixCls('notification');
      const noticePrefixCls = `${prefixCls}-notice`;

      const configList = props.items.map((item) => {
        const { actions, description, duration, key, showProgress, title, type } = item;
        const typeIconCls = type ? `${noticePrefixCls}-icon-${type}` : undefined;
        return {
          key,
          actions,
          closable: { closeIcon: getCloseIcon(noticePrefixCls) },
          description,
          duration,
          icon: type ? h(TypeIcon[type]) : null,
          showProgress,
          title,
          className: type ? `${noticePrefixCls}-${type}` : undefined,
          classNames: { icon: typeIconCls },
        };
      });

      return h(NoticeList, {
        prefixCls,
        placement: props.placement,
        configList,
        classNames: props.classNames,
        style: props.style,
        stack: false,
      } as never);
    };
  },
});
