/**
 * Steps —— antd `progress/Steps.tsx` 的 Vue 版（内部 engine，不对外）。
 */

import { defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { clsx } from '../../_internal/clsx';
import type {
  ProgressProps,
  ProgressSemanticClassNames,
  ProgressSemanticStyles,
} from '../interface';
import { getSize, px } from '../utils';

export interface StepsProps {
  prefixCls: string;
  classNames: ProgressSemanticClassNames;
  styles: ProgressSemanticStyles;
  size?: ProgressProps['size'];
  steps: number;
  rounding?: (step: number) => number;
  percent?: number;
  strokeWidth?: number;
  strokeColor?: string | string[];
  railColor?: string;
  trailColor?: string;
}

export default defineComponent({
  name: 'AProgressSteps',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    classNames: { type: Object as PropType<ProgressSemanticClassNames>, required: true },
    styles: { type: Object as PropType<ProgressSemanticStyles>, required: true },
    size: { type: null as unknown as PropType<ProgressProps['size']>, default: undefined },
    steps: { type: Number, required: true },
    rounding: {
      type: Function as PropType<(step: number) => number>,
      default: Math.round,
    },
    percent: { type: Number, default: 0 },
    strokeWidth: { type: Number, default: 8 },
    strokeColor: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
    railColor: { type: String, default: undefined },
    trailColor: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    return (): VNodeChild => {
      const { prefixCls, classNames, styles, steps } = props;
      // `rounding` 的运行时默认是 `Math.round` ⇒ `?? Math.round` 与原 `!` 行为一致
      const current = (props.rounding ?? Math.round)(steps * (props.percent / 100));
      const stepWidth = props.size === 'small' ? 2 : 14;
      const mergedSize = props.size ?? [stepWidth, props.strokeWidth];
      const [width, height] = getSize(mergedSize, 'step', {
        steps,
        strokeWidth: props.strokeWidth,
      });
      const unitWidth = width / steps;

      const mergedRailColor = props.railColor ?? props.trailColor;

      const styledSteps = Array.from({ length: steps }, (_, i) => {
        const color = Array.isArray(props.strokeColor) ? props.strokeColor[i] : props.strokeColor;
        return h('div', {
          key: i,
          class: clsx(
            `${prefixCls}-steps-item`,
            { [`${prefixCls}-steps-item-active`]: i <= current - 1 },
            classNames.track,
          ),
          style: {
            backgroundColor: i <= current - 1 ? color : mergedRailColor,
            width: px(unitWidth),
            height: px(height),
            ...styles.track,
          },
        });
      });

      return h(
        'div',
        {
          class: clsx(`${prefixCls}-steps-body`, classNames.body),
          style: styles.body,
        },
        [...styledSteps, slots.default?.()],
      );
    };
  },
});
