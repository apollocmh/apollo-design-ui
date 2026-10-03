/**
 * Actions —— Transfer 中部的操作按钮列（也作为 `Transfer.Operation` 暴露）。
 *
 * 契约来源：antd 6.6.4 `es/transfer/Actions.js`（**机械移植**）。
 *
 * 每个按钮的可用态是三路与：`!disabled && active`（active = 对侧有可移动的勾选）。
 * `actions` 元素为节点时 clone 并注入 disabled/onClick（点击先调用户回调再触发移动）；
 * `oneWay` 时只渲染「向右」+ `actions.slice(1)` 的尾随元素。
 */

import { LeftOutlined, RightOutlined } from '@apollo-design/icons';
import { defineComponent, h, type PropType, type VNode, type VNodeChild } from 'vue';
import Button from '../button/Button.vue';

export interface ActionsProps {
  className?: string;
  style?: Record<string, string>;
  rightActive?: boolean;
  moveToRight?: (e?: unknown) => void;
  leftActive?: boolean;
  moveToLeft?: (e?: unknown) => void;
  actions?: VNodeChild[];
  disabled?: boolean;
  direction?: 'ltr' | 'rtl';
  oneWay?: boolean;
}

function getArrowIcon(type: 'left' | 'right', direction?: 'ltr' | 'rtl'): VNode {
  const isRight = type === 'right';
  if (direction !== 'rtl') {
    return isRight ? h(RightOutlined) : h(LeftOutlined);
  }
  return isRight ? h(LeftOutlined) : h(RightOutlined);
}

const Action = defineComponent({
  name: 'ATransferAction',
  props: {
    type: { type: String as PropType<'left' | 'right'>, required: true },
    actions: { type: Array as PropType<VNodeChild[]>, required: true },
    moveToRight: { type: Function as PropType<ActionsProps['moveToRight']>, default: undefined },
    moveToLeft: { type: Function as PropType<ActionsProps['moveToLeft']>, default: undefined },
    leftActive: { type: Boolean, default: undefined },
    rightActive: { type: Boolean, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
    disabled: { type: Boolean, default: undefined },
  },
  setup(props) {
    return () => {
      const isRight = props.type === 'right';
      const button = isRight ? props.actions[0] : props.actions[1];
      const moveHandler = isRight ? props.moveToRight : props.moveToLeft;
      const active = isRight ? props.rightActive : props.leftActive;
      const icon = getArrowIcon(props.type, props.direction);

      if (button && typeof button === 'object' && 'type' in (button as VNode)) {
        const element = button as VNode & { props?: Record<string, unknown> };
        const mergedDisabled = element.props?.disabled || props.disabled || !active;
        const onClick = (event: Event) => {
          if (mergedDisabled) {
            event.preventDefault();
            return;
          }
          (element.props?.onClick as ((e: Event) => void) | undefined)?.(event);
          moveHandler?.(event);
        };
        return h(element, { disabled: mergedDisabled, onClick });
      }
      return h(
        Button,
        {
          type: 'primary',
          size: 'small',
          disabled: props.disabled || !active,
          onClick: (event: unknown) => moveHandler?.(event),
          icon,
        },
        // ⚠️ 与 React children=undefined 对齐：空文案不给 slot，否则
        //    Vue 侧 slot 函数仍会被计入 childNodes ⇒ 多渲染一个空内容 span、
        //    且 Button 的 `-icon-only` 判定失效。
        button !== undefined && button !== null ? { default: () => button } : undefined,
      );
    };
  },
});

const Actions = defineComponent({
  name: 'ATransferActions',
  props: {
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string>>, default: undefined },
    rightActive: { type: Boolean, default: undefined },
    moveToRight: { type: Function as PropType<ActionsProps['moveToRight']>, default: undefined },
    leftActive: { type: Boolean, default: undefined },
    moveToLeft: { type: Function as PropType<ActionsProps['moveToLeft']>, default: undefined },
    actions: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    disabled: { type: Boolean, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
    oneWay: { type: Boolean, default: undefined },
  },
  setup(props) {
    return () => {
      const tail = props.actions?.slice(props.oneWay ? 1 : 2) ?? [];
      return h('div', { class: props.className, style: props.style }, [
        h(Action, {
          type: 'right',
          actions: props.actions ?? [],
          rightActive: props.rightActive,
          moveToRight: props.moveToRight,
          leftActive: props.leftActive,
          moveToLeft: props.moveToLeft,
          direction: props.direction,
          disabled: props.disabled,
        }),
        !props.oneWay
          ? h(Action, {
              type: 'left',
              actions: props.actions ?? [],
              rightActive: props.rightActive,
              moveToRight: props.moveToRight,
              leftActive: props.leftActive,
              moveToLeft: props.moveToLeft,
              direction: props.direction,
              disabled: props.disabled,
            })
          : null,
        ...tail,
      ]);
    };
  },
});

export default Actions;
