/**
 * StepHandler —— 步进按钮（按住连发）。
 *
 * 契约来源：`@rc-component/input-number@1.6.2` 的 `es/StepHandler.js`（83 行）。
 * 行为规格（逐条对齐）：
 *
 * 1. mousedown ⇒ preventDefault + 立即步进一次；600ms（STEP_DELAY）后每
 *    200ms（STEP_INTERVAL）连发 —— 两个 setTimeout 链，不是 setInterval。
 * 2. mouseup / mouseleave ⇒ 停止连发。⚠️ 上游用 raf 包一层（Safari 在快速
 *    点击时 mouseup 会先于 mousedown 执行，乱序会让停步指令丢失）—— 本仓
 *    复用 utils 的 `raf`（含 cancel）同构实现。
 * 3. DOM：`span.{p}-action.{p}-action-{up|down} [-action-{up|down}-disabled]`，
 *    `unselectable="on"`、`role="button"`、`aria-label="Increase Value"/"Decrease Value"`、
 *    `aria-disabled`。子节点缺省时渲染 `span.{p}-action-{up|down}-inner`。
 * 4. `disabled` 只影响类名与 aria —— 「到边界后仍可点但不步进」的判定在
 *    upDisabled/downDisabled（引擎层），按钮不据此禁用。
 */

import { cancelRaf, raf } from '@apollo-design/utils';
import { defineComponent, h, onScopeDispose, type PropType, type VNodeChild } from 'vue';

/** 点击按住时连发的间隔（ms）。 */
export const STEP_INTERVAL = 200;
/** 首次按下到开始连发的延迟（ms）。 */
export const STEP_DELAY = 600;

export interface StepInfo {
  offset: number | string;
  type: 'up' | 'down';
  emitter: 'handler' | 'keyboard' | 'wheel';
}

export const StepHandler = defineComponent({
  name: 'AInputNumberStepHandler',
  props: {
    prefixCls: { type: String, required: true },
    action: {
      type: String as PropType<'up' | 'down'>,
      required: true,
    },
    disabled: { type: Boolean, default: false },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    /** 内层图标节点（antd 的 upHandler/downHandler 透传）。
     *  内部：由 InputNumber 引擎程序化传递，无模板上下文，VNode prop 合法（C8-R2 §4）。 */
    node: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** 步进回调（引擎的 onInternalStep）。 */
    onStep: {
      type: Function as PropType<(up: boolean, emitter: StepInfo['emitter']) => void>,
      required: true,
    },
  },
  setup(props) {
    const isUpAction = props.action === 'up';
    let stepTimeout: ReturnType<typeof setTimeout> | undefined;
    const frameIds: number[] = [];

    const onStopStep = (): void => {
      clearTimeout(stepTimeout);
    };

    const onStepMouseDown = (e: MouseEvent): void => {
      e.preventDefault();
      onStopStep();
      props.onStep(isUpAction, 'handler');

      // 首次按下等 STEP_DELAY 再进入连发循环
      const loopStep = (): void => {
        props.onStep(isUpAction, 'handler');
        stepTimeout = setTimeout(loopStep, STEP_INTERVAL);
      };
      stepTimeout = setTimeout(loopStep, STEP_DELAY);
    };

    // Safari 乱序保护：mouseup 经 raf 排队，保证晚于 mousedown 处理
    const safeOnStopStep = (): void => {
      frameIds.push(raf(onStopStep));
    };

    onScopeDispose(() => {
      onStopStep();
      for (const id of frameIds) {
        cancelRaf(id);
      }
    });

    return () => {
      const actionClassName = `${props.prefixCls}-action`;
      const mergedClassName = [
        actionClassName,
        `${actionClassName}-${props.action}`,
        {
          [`${actionClassName}-${props.action}-disabled`]: props.disabled,
        },
        props.className,
      ];

      return h(
        'span',
        {
          class: mergedClassName,
          style: props.style,
          unselectable: 'on',
          role: 'button',
          'aria-label': isUpAction ? 'Increase Value' : 'Decrease Value',
          'aria-disabled': props.disabled,
          // ⚠️ h() 的键名必须「on + 全小写」：Vue 会把 on 后的首字母大写 hyphenate
          //    成事件名 —— `onMouseDown` 会注册成非标准的 `mouse-down` 事件（实测）。
          onMousedown: onStepMouseDown,
          onMouseup: safeOnStopStep,
          onMouseleave: safeOnStopStep,
        },
        props.node !== undefined && props.node !== null
          ? [props.node]
          : [
              h('span', {
                unselectable: 'on',
                class: `${props.prefixCls}-action-${props.action}-inner`,
              }),
            ],
      );
    };
  },
});
