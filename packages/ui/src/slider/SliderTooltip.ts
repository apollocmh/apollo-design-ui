/**
 * `SliderTooltip` —— antd `es/slider/SliderTooltip.js`（42 行）的 Vue 等价物。
 *
 * 它只做一件事：把「弹层」换成 antd 的 Tooltip，并把 slider 的上下文（`value` / `draggingDelete`）
 * 透进去（`TooltipPurePanel` 之类的消费方据此渲染不同文案）。
 *
 * ⚠️ 与本仓 Tooltip 的差异（逐条来自 antd 的来源）：
 *   1. `classNames.root` 固定拼 `${sliderPrefixCls}-tooltip`（antd 由 slider 壳传入）；
 *   2. `title` 由调用方算好（`formatter(value)`），本组件不管格式化；
 *   3. `getPopupContainer` 的 fallback 链在**壳**里解决（`tooltip.getPopupContainer || ConfigProvider.getPopupContainer`），
 *      本组件只负责透传。
 */

import { defineComponent, h, type PropType, type VNodeChild } from 'vue';
import Tooltip from '../tooltip';
import type { SliderTooltipProps } from './interface';

export default defineComponent({
  name: 'ASliderTooltip',
  props: {
    prefixCls: { type: String, required: true },
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    open: { type: Boolean, default: false },
    placement: { type: String as PropType<SliderTooltipProps['placement']>, default: undefined },
    getPopupContainer: {
      type: Function as PropType<SliderTooltipProps['getPopupContainer']>,
      default: undefined,
    },
    /** `tooltip` prop 的其余字段（arrow / color / mouseEnterDelay …）原样透传。 */
    tooltipProps: {
      type: Object as PropType<SliderTooltipProps>,
      default: () => ({}),
    },
  },
  setup(props, { slots }) {
    return () =>
      h(
        Tooltip as never,
        {
          ...(props.tooltipProps as Record<string, unknown>),
          // slider 的 tooltip 由壳控制开合，禁用 Tooltip 自己的 hover 触发
          title: props.title,
          open: props.open,
          placement: props.placement,
          getPopupContainer: props.getPopupContainer,
          classNames: {
            ...(props.tooltipProps?.classNames ?? {}),
            root: `${props.prefixCls}-tooltip`,
          },
        } as never,
        { default: () => slots.default?.() },
      );
  },
});
