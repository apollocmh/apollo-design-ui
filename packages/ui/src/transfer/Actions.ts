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
import { createVNode, defineComponent, h, type PropType, type VNode, type VNodeChild } from 'vue';
import Button from '../button/Button.vue';

export interface ActionsProps {
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
        // ⚠️ 用户原回调要从**原 element.props** 上取 —— 它在下面的重建 props 里
        //    会被我们的 `onClick` 覆盖掉（React cloneElement 的替换语义）。
        const userOnClick = element.props?.onClick as ((e: Event) => void) | undefined;
        const onClick = (event: Event) => {
          if (mergedDisabled) {
            event.preventDefault();
            return;
          }
          userOnClick?.(event);
          moveHandler?.(event);
        };
        /**
         * 🚨 **必须 `createVNode` 重建，不能用 `h(element, {...})`**（Issue #15.1）。
         *
         * 上游是 `React.cloneElement(element, { disabled, onClick })` —— React 的语义是
         * **替换**：config 里的键覆盖同名键，其余保留。而 Vue 的 `h(vnode, extra)` 对已有
         * VNode 走 `cloneVNode` → `mergeProps(vnode.props, extra)`，`mergeProps` 对
         * `on*` 键是**拼成数组**（不是覆盖）：
         *
         * - `onClick` 在两边都存在（用户原回调 vs 我们的合成器）⇒ 合并成
         *   `[user, ours]` ⇒ 用户回调先在数组里调一次、又在新 `onClick` 里显式调一次
         *   ⇒ **双调**（实测 2 次）；
         * - 禁用态更糟：数组里排在首位的 user 回调**先于**我们的 `mergedDisabled`
         *   早退执行 ⇒ 禁用态也漏调一次用户回调。
         *
         * ⇒ 自己构造最终 props（同名键覆盖 = 替换）再 `createVNode(element.type, …)`。
         *    `key` / `ref` 不是 props 而是 vnode 字段，但 `createBaseVNode` 会从
         *    `props.key` / `props.ref` 取 ⇒ 随 `element.props` 原样铺过去即可
         *    （同 `FormItem.vue` 的 Issue #8.3 判据）。
         */
        return createVNode(
          element.type,
          {
            ...(element.props ?? {}),
            disabled: mergedDisabled,
            onClick,
          } as never,
          element.children as never,
        );
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
      // 根 class/style 走 Vue 原生 attrs（未关 inheritAttrs ⇒ 自动落到根 div）
      return h('div', null, [
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
