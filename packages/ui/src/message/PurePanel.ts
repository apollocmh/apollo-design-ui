/**
 * `PurePanel` —— antd `components/message/PurePanel.tsx` 的 Vue 版。
 *
 * 单条消息的**静态**面板（不 portal、不自动关闭），用于：
 *   - 文档 / 调试（`message._InternalPanelDoNotUseOrYouWillBeFired`）；
 *   - L4/L6 的静态形态（命令式路径整体走 portal，SSR 拿不到）。
 *
 * 逐条对齐上游的三件事：
 *   1. 根类名是 `{p}-notice-pure-panel`（**不是** `{p}`）⇒ 组件变量声明块必须
 *      额外挂在这个根上（同 input 的 D69 / image 的 D95，见 `style/index.ts`）；
 *   2. `duration` 恒 `null`（静态面板不会自己消失）；
 *   3. `wrapper` / `icon` 槽要叠加类型类：`{p}-{type}` 与 `{p}-notice-icon-{type}`。
 */
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';

import { useComponentConfig } from '../config-provider/context';
import Notice from '../notification/engine/Notice';
import { clsx } from '../notification/engine/util';
import { getMessageIcon } from './icon';
import type { ArgsProps, MessageSemanticType, NoticeType } from './interface';

export interface PurePanelProps {
  prefixCls?: string;
  className?: string;
  style?: ArgsProps['style'];
  type?: NoticeType;
  icon?: VNodeChild;
  content?: VNodeChild;
  classNames?: MessageSemanticType['classNames'];
  styles?: MessageSemanticType['styles'];
}

export default defineComponent({
  name: 'AMessagePurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<ArgsProps['style']>, default: undefined },
    type: { type: String as PropType<NoticeType>, default: undefined },
    icon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    content: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    classNames: { type: Object as PropType<MessageSemanticType['classNames']>, default: undefined },
    styles: { type: Object as PropType<MessageSemanticType['styles']>, default: undefined },
  },
  setup(props, { attrs }) {
    return () => {
      const config = useComponentConfig('message');
      const prefixCls = props.prefixCls || config.getPrefixCls('message');
      const noticePrefixCls = `${prefixCls}-notice`;

      const iconNode = getMessageIcon(props.type, props.icon);
      const typeIconCls = props.type ? `${noticePrefixCls}-icon-${props.type}` : undefined;

      return h(
        'div',
        {
          class: [`${noticePrefixCls}-pure-panel`, props.className, props.classNames?.root],
          style: props.styles?.root,
        },
        h(Notice, {
          ...(attrs as Record<string, unknown>),
          prefixCls,
          className: (config.className as string | undefined) ?? undefined,
          style: { ...(config.style as object | undefined), ...(props.style ?? {}) },
          duration: null,
          icon: iconNode,
          title: props.content,
          classNames: {
            wrapper: clsx(
              props.type ? `${prefixCls}-${props.type}` : undefined,
              props.classNames?.wrapper,
            ),
            icon: clsx(typeIconCls, props.classNames?.icon),
            title: props.classNames?.title,
          },
          styles: {
            wrapper: props.styles?.wrapper,
            icon: props.styles?.icon,
            title: props.styles?.title,
          },
        } as never),
      );
    };
  },
});
