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
import { isEmptyVNode, isRenderable } from '@apollo-design/utils';
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';

import { computeClosable, pickClosable } from '../_internal/use-closable';
import { useComponentConfig } from '../config-provider/context';
import Notice from './engine/Notice';
import { getCloseIcon, getCloseIconWithLabel, TypeIcon } from './icon';
import type { IconType, NotificationSemanticType } from './interface';

export default defineComponent({
  name: 'ANotificationPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    /** @deprecated 请用 `title`。收窄为 String（富标题走 `#message` slot）。 */
    message: { type: String, default: undefined },
    title: { type: String, default: undefined },
    description: { type: String, default: undefined },
    type: { type: String as PropType<IconType>, default: undefined },
    role: { type: String as PropType<'alert' | 'status'>, default: undefined },
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
    // ⚠️ C8-R2：原 `icon` / `btn` / `actions` / `closeIcon` 删除改为同名 slot
    //    （`#icon` / `#btn` / `#actions` / `#closeIcon`，空 slot 等价隐藏）；
    //    `title` / `message` / `description` 收窄为 String（富内容走同名 slot，slot 优先）。
  },
  setup(props, { attrs, slots }) {
    // ============ slot：ReactNode / render prop 的唯一入口（规则 C8-R2）============
    const readSlot = (name: string): unknown => {
      const fn = (slots as Record<string, unknown>)[name];
      if (typeof fn !== 'function') return undefined;
      const nodes = (fn as (...args: unknown[]) => unknown)();
      if (nodes === undefined) return undefined;
      return isEmptyVNode(nodes) ? null : nodes;
    };

    return () => {
      const config = useComponentConfig('notification');
      const prefixCls = props.prefixCls || config.getPrefixCls('notification');
      const noticePrefixCls = `${prefixCls}-notice`;

      const titleSlot = readSlot('title');
      const messageSlot = readSlot('message');
      const mergedTitle: unknown =
        titleSlot !== undefined
          ? titleSlot
          : messageSlot !== undefined
            ? messageSlot
            : (props.title ?? props.message);
      const hasTitle = isRenderable(mergedTitle);

      const descriptionSlot = readSlot('description');
      const mergedDescription: unknown =
        descriptionSlot !== undefined ? descriptionSlot : props.description;

      const actionsSlot = readSlot('actions');
      const btnSlot = readSlot('btn');
      const mergedActions: unknown =
        actionsSlot !== undefined ? actionsSlot : btnSlot !== undefined ? btnSlot : undefined;

      const iconSlot = readSlot('icon');
      const iconNode =
        iconSlot !== undefined ? iconSlot : props.type ? h(TypeIcon[props.type]) : null;
      const typeIconCls =
        !iconSlot && props.type ? `${noticePrefixCls}-icon-${props.type}` : undefined;

      const closeIconSlot = readSlot('closeIcon');
      const { closable, closeIconNode, ariaProps } = computeClosable(
        pickClosable({ closable: props.closable, closeIcon: closeIconSlot as VNodeChild }).value,
        undefined,
        {
          closable: true,
          closeIcon: h(getCloseIcon(prefixCls, undefined) as never),
          closeIconRender: (icon) => getCloseIconWithLabel(prefixCls, icon as VNodeChild, 'Close'),
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
          description: mergedDescription as never,
          icon: iconNode as never,
          actions: mergedActions as never,
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
