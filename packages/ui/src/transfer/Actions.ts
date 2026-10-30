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
import {
  cloneVNode,
  defineComponent,
  h,
  isVNode,
  type PropType,
  type VNode,
  type VNodeChild,
} from 'vue';
import Button from '../button/Button.vue';

export interface ActionsProps {
  rightActive?: boolean;
  onMoveToRight?: (event: MouseEvent) => void;
  leftActive?: boolean;
  onMoveToLeft?: (event: MouseEvent) => void;
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
    moveToRight: { type: Function as PropType<ActionsProps['onMoveToRight']>, default: undefined },
    moveToLeft: { type: Function as PropType<ActionsProps['onMoveToLeft']>, default: undefined },
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

      const isCustomButton =
        isVNode(button) &&
        (button.type === Button ||
          (typeof button.type === 'string' && ['button', 'a', 'input'].includes(button.type)) ||
          !!button.props?.onClick);
      if (isCustomButton) {
        const element = cloneVNode(button);
        const mergedDisabled = !!(element.props?.disabled || props.disabled || !active);
        const listener = element.props?.onClick;
        const listeners = Array.isArray(listener) ? listener : listener ? [listener] : [];
        // Keep Vue's owner, ref, key and directives. Replace the handler once;
        // Vue invokes listener arrays and reports errors through its normal channel.
        element.props = {
          ...element.props,
          disabled: mergedDisabled,
          onClick: mergedDisabled
            ? (event: MouseEvent) => event.preventDefault()
            : [...listeners, ...(moveHandler ? [moveHandler] : [])],
        };
        return element;
      }
      return h(
        Button,
        {
          type: 'primary',
          size: 'small',
          disabled: props.disabled || !active,
          onClick: (event: MouseEvent) => moveHandler?.(event),
          'aria-label':
            typeof button === 'string' || typeof button === 'number'
              ? undefined
              : isRight
                ? 'Move selected items to target'
                : 'Move selected items to source',
          icon: isVNode(button) ? undefined : icon,
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
    rightActive: { type: Boolean, default: undefined },
    leftActive: { type: Boolean, default: undefined },
    actions: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    disabled: { type: Boolean, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
    oneWay: { type: Boolean, default: undefined },
  },
  emits: {
    moveToRight: (_event: MouseEvent) => true,
    moveToLeft: (_event: MouseEvent) => true,
  },
  setup(props, { emit }) {
    return () => {
      const tail = props.actions?.slice(props.oneWay ? 1 : 2) ?? [];
      // 根 class/style 走 Vue 原生 attrs（未关 inheritAttrs ⇒ 自动落到根 div）
      return h('div', null, [
        h(Action, {
          type: 'right',
          actions: props.actions ?? [],
          rightActive: props.rightActive,
          moveToRight: (event: MouseEvent) => emit('moveToRight', event),
          leftActive: props.leftActive,
          moveToLeft: (event: MouseEvent) => emit('moveToLeft', event),
          direction: props.direction,
          disabled: props.disabled,
        }),
        !props.oneWay
          ? h(Action, {
              type: 'left',
              actions: props.actions ?? [],
              rightActive: props.rightActive,
              moveToRight: (event: MouseEvent) => emit('moveToRight', event),
              leftActive: props.leftActive,
              moveToLeft: (event: MouseEvent) => emit('moveToLeft', event),
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
