/**
 * `PurePanel` —— antd `components/notification/PurePanel.tsx` 的 Vue 版。
 *
 * 单条通知的**静态**面板（不 portal、不自动关闭）：文档 / 调试 / L4·L6 的静态形态。
 *
 * 逐条对齐上游：
 *   1. 根类是 `{p}-notice-pure-panel`（**不是** `{p}`）⇒ 组件变量声明块必须额外挂在这个根上
 *      （同 input D69 / image D95 / message D96 家族）；
 *   2. `duration` 恒 `null`；
 *   3. `closable` 走 `useClosable`（fallback 是 `closable: true` + `CloseOutlined` 带
 *      `{p}-close-icon` 类 + `closeIconRender`）；
 *   4. `title` / `message` 合并（`message` deprecated），`actions` / `btn` 同理；
 *   5. `-notice-icon-{type}` 类**只在没有自定义 icon 时**叠加（与 message 的「恒叠加」不同）。
 */
import { isRenderable } from '@apollo-design/utils';
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';

import { computeClosable, pickClosable } from '../_internal/use-closable';
import { useComponentConfig } from '../config-provider/context';
import Notice from './engine/Notice';
import { getCloseIcon, TypeIcon } from './icon';
import type { IconType, NotificationSemanticType } from './interface';

export default defineComponent({
  name: 'ANotificationPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    icon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** @deprecated 请用 `title`。 */
    message: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    description: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** @deprecated 请用 `actions`。 */
    btn: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    actions: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    type: { type: String as PropType<IconType>, default: undefined },
    role: { type: String as PropType<'alert' | 'status'>, default: undefined },
    closeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    closable: {
      type: [Boolean, Object] as PropType<import('./interface').ArgsProps['closable']>,
      default: undefined,
    },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<NotificationSemanticType['styles']>, default: undefined },
    classNames: {
      type: Object as PropType<NotificationSemanticType['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<NotificationSemanticType['styles']>, default: undefined },
  },
  setup(props, { attrs }) {
    return () => {
      const config = useComponentConfig('notification');
      const prefixCls = props.prefixCls || config.getPrefixCls('notification');
      const noticePrefixCls = `${prefixCls}-notice`;

      const mergedTitle = props.title ?? props.message;
      const hasTitle = isRenderable(mergedTitle);
      const mergedActions = props.actions ?? props.btn;

      const iconNode = props.icon || (props.type ? h(TypeIcon[props.type]) : null);
      const typeIconCls =
        !props.icon && props.type ? `${noticePrefixCls}-icon-${props.type}` : undefined;

      const { closable, closeIconNode, ariaProps } = computeClosable(
        pickClosable({ closable: props.closable, closeIcon: props.closeIcon }).value,
        undefined,
        {
          closable: true,
          closeIcon: h(getCloseIcon(prefixCls, undefined) as never),
          closeIconRender: (icon) => getCloseIcon(prefixCls, icon as VNodeChild),
        },
      );

      return h(
        'div',
        {
          class: [`${noticePrefixCls}-pure-panel`, props.className, props.classNames?.root],
          style: props.styles?.root,
        },
        h(Notice, {
          ...(attrs as Record<string, unknown>),
          prefixCls,
          style: { ...(config.style as object | undefined), ...(props.style ?? {}) },
          duration: null,
          closable: closable
            ? {
                closeIcon: closeIconNode,
                ...ariaProps,
              }
            : false,
          className: config.className as string | undefined,
          title: hasTitle ? mergedTitle : null,
          description: props.description,
          icon: iconNode,
          actions: mergedActions,
          role: props.role,
          classNames: {
            ...props.classNames,
            icon: [typeIconCls, props.classNames?.icon].filter(Boolean).join(' ') || undefined,
          },
          styles: props.styles,
        } as never),
      );
    };
  },
});
