/** A stable semantic host for all custom Vue content and the built-in indicator. */
import { type CSSProperties, defineComponent, h, type VNodeChild } from 'vue';
import { NodeRenderer } from '../../_internal/node-renderer';
import { Looper } from './Looper';

interface IndicatorProps {
  prefixCls: string;
  indicator?: VNodeChild;
  custom: boolean;
  percent?: number;
  className?: string;
  style?: CSSProperties;
}
export const Indicator = defineComponent(
  (props: IndicatorProps) => () =>
    h(
      'span',
      {
        class: [`${props.prefixCls}-indicator`, props.className],
        style: props.style,
      },
      props.custom
        ? [h(NodeRenderer, { node: props.indicator })]
        : [
            h(Looper, {
              prefixCls: props.prefixCls,
              percent: props.percent,
            }),
          ],
    ),
  {
    name: 'ASpinIndicator',
    inheritAttrs: false,
    props: ['prefixCls', 'indicator', 'custom', 'percent', 'className', 'style'],
  },
);
