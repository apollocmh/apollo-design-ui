/**
 * Line —— antd `progress/Line.tsx` 的 Vue 版（内部 engine，不对外）。
 *
 * 结构（antd 产物逐字）：body > rail > (percent track [, success track])；indicator
 * inner 时进 percent track、outer 时跟在 rail 后。
 */

import { defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { clsx } from '../../notification/engine/util';
import type {
  PercentPositionType,
  ProgressGradient,
  ProgressProps,
  ProgressSemanticClassNames,
  ProgressSemanticStyles,
  SuccessProps,
} from '../interface';
import {
  getSize,
  getSuccessPercent,
  handleGradient,
  LineStrokeColorVar,
  px,
  validProgress,
} from '../utils';

export interface LineProps {
  prefixCls: string;
  classNames: ProgressSemanticClassNames;
  styles: ProgressSemanticStyles;
  direction?: string;
  percent?: number;
  size?: ProgressProps['size'];
  strokeWidth?: number;
  strokeColor?: string | ProgressGradient;
  strokeLinecap?: 'butt' | 'square' | 'round';
  railColor?: string;
  trailColor?: string;
  percentPosition: PercentPositionType;
  success?: SuccessProps;
}

export default defineComponent({
  name: 'AProgressLine',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    classNames: { type: Object as PropType<ProgressSemanticClassNames>, required: true },
    styles: { type: Object as PropType<ProgressSemanticStyles>, required: true },
    direction: { type: String, default: undefined },
    percent: { type: Number, default: undefined },
    size: { type: null as unknown as PropType<ProgressProps['size']>, default: undefined },
    strokeWidth: { type: Number, default: undefined },
    strokeColor: {
      type: [String, Object] as PropType<string | ProgressGradient>,
      default: undefined,
    },
    strokeLinecap: {
      type: String as PropType<'butt' | 'square' | 'round'>,
      default: 'round',
    },
    railColor: { type: String, default: undefined },
    trailColor: { type: String, default: undefined },
    percentPosition: {
      type: Object as PropType<PercentPositionType>,
      required: true,
    },
    success: { type: Object as PropType<SuccessProps>, default: undefined },
  },
  setup(props, { slots }) {
    return (): VNodeChild => {
      const { prefixCls, classNames, styles, direction: directionConfig } = props;
      const { align: infoAlign, type: infoPosition } = props.percentPosition;

      const mergedRailColor = props.railColor ?? props.trailColor;

      const borderRadius =
        props.strokeLinecap === 'square' || props.strokeLinecap === 'butt' ? 0 : undefined;

      const mergedSize = props.size ?? [-1, props.strokeWidth || (props.size === 'small' ? 6 : 8)];

      const [width, height] = getSize(mergedSize, 'line', { strokeWidth: props.strokeWidth });

      // ---- Rail ----
      const railStyle: Record<string, unknown> = {
        backgroundColor: mergedRailColor || undefined,
        borderRadius,
        height: px(height),
      };

      // ---- Tracks ----
      const trackCls = `${prefixCls}-track`;

      const backgroundProps =
        props.strokeColor && typeof props.strokeColor !== 'string'
          ? handleGradient(props.strokeColor, directionConfig)
          : ({ [LineStrokeColorVar]: props.strokeColor, background: props.strokeColor } as Record<
              string,
              string
            >);

      const percentTrackStyle: Record<string, unknown> = {
        width: `${validProgress(props.percent)}%`,
        height: px(height),
        borderRadius,
        ...backgroundProps,
      };

      const successPercent = getSuccessPercent({ success: props.success });

      const successTrackStyle: Record<string, unknown> = {
        width: `${validProgress(successPercent)}%`,
        height: px(height),
        borderRadius,
        backgroundColor: props.success?.strokeColor,
      };

      const indicator = slots.default?.();

      const trackClass = clsx(trackCls, classNames.track);

      return h(
        'div',
        {
          class: clsx(`${prefixCls}-body`, classNames.body, {
            [`${prefixCls}-body-layout-bottom`]: infoAlign === 'center' && infoPosition === 'outer',
          }),
          style: { width: width > 0 ? width : '100%', ...styles.body },
        },
        [
          h(
            'div',
            {
              class: clsx(`${prefixCls}-rail`, classNames.rail),
              style: { ...railStyle, ...styles.rail },
            },
            [
              // Percent track
              h(
                'div',
                {
                  class: trackClass,
                  style: { ...percentTrackStyle, ...styles.track },
                },
                infoPosition === 'inner' ? (indicator ?? undefined) : undefined,
              ),
              // Success track
              successPercent !== undefined
                ? h('div', {
                    class: clsx(trackCls, `${trackCls}-success`, classNames.track),
                    style: { ...successTrackStyle, ...styles.track },
                  })
                : null,
            ],
          ),
          // Indicator（outer 时在 rail 后）
          infoPosition === 'outer' ? (indicator ?? undefined) : undefined,
        ],
      );
    };
  },
});
