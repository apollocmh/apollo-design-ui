/** A controlled Tooltip bridge; Slider owns visibility and value formatting. */
import { defineComponent, h, type PropType, type SlotsType, type VNodeChild } from 'vue';
import { mergeClassNames, resolveSemantic } from '../_internal/use-merge-semantic';
import Tooltip from '../tooltip';
import type { SliderTooltipProps } from './interface';

export default defineComponent({
  name: 'ASliderTooltip',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    title: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    open: { type: Boolean, default: false },
    placement: { type: String as PropType<SliderTooltipProps['placement']>, default: undefined },
    getPopupContainer: {
      type: Function as PropType<SliderTooltipProps['getPopupContainer']>,
      default: undefined,
    },
    tooltipProps: { type: Object as PropType<SliderTooltipProps>, default: () => ({}) },
  },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    return () => {
      const { formatter: _formatter, ...tooltip } = props.tooltipProps;
      return h(
        Tooltip,
        {
          ...tooltip,
          title: props.title,
          open: props.open,
          placement: props.placement,
          getPopupContainer: props.getPopupContainer,
          trigger: [],
          classNames: (info) =>
            mergeClassNames(resolveSemantic(tooltip.classNames, info), {
              root: `${props.prefixCls}-tooltip`,
            }),
        },
        { default: () => slots.default?.() },
      );
    };
  },
});
