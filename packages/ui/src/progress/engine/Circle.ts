/**
 * Circle —— antd `progress/Circle.tsx` 的 Vue 版（内部 engine，不对外）。
 *
 * SVG 计算内核在本目录 `circle.ts`（rc-progress 数学事实的自研实现，H5）。
 * gradient（plain object strokeColor）⇒ mask + foreignObject 的 conic 方案
 * （PtgCircle 语义；gradientId 经 Vue useId 生成）。
 */

import { isPlainObject } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, useId, type VNodeChild } from 'vue';
import { clsx } from '../../_internal/clsx';
import Tooltip from '../../tooltip/Tooltip';
import type {
  GapPlacement,
  GapPosition,
  ProgressProps,
  ProgressSemanticClassNames,
  ProgressSemanticStyles,
  SuccessProps,
} from '../interface';
import { getPercentage, getSize, getStrokeColor, px } from '../utils';
import { getCircleStyle, getPtgColors, VIEW_BOX_SIZE } from './kernel';

const CIRCLE_MIN_STROKE_WIDTH = 3;

const getMinPercent = (width: number): number => (CIRCLE_MIN_STROKE_WIDTH / width) * 100;

export interface CircleProps {
  prefixCls: string;
  classNames: ProgressSemanticClassNames;
  styles: ProgressSemanticStyles;
  railColor?: string;
  trailColor?: string;
  strokeLinecap?: 'butt' | 'square' | 'round';
  gapPosition?: GapPosition;
  gapPlacement?: GapPlacement;
  gapDegree?: number;
  width?: number;
  type?: ProgressProps['type'];
  success?: SuccessProps;
  size?: ProgressProps['size'];
  steps?: number | { count: number; gap: number };
  strokeColor?: string | string[] | Record<string, string>;
  percent?: number;
  direction?: string;
}

export default defineComponent({
  name: 'AProgressCircle',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    classNames: { type: Object as PropType<ProgressSemanticClassNames>, required: true },
    styles: { type: Object as PropType<ProgressSemanticStyles>, required: true },
    railColor: { type: String, default: undefined },
    trailColor: { type: String, default: undefined },
    strokeLinecap: {
      type: String as PropType<'butt' | 'square' | 'round'>,
      default: 'round',
    },
    gapPosition: {
      type: String as PropType<GapPosition>,
      default: undefined,
    },
    gapPlacement: {
      type: String as PropType<GapPlacement>,
      default: undefined,
    },
    gapDegree: { type: Number, default: undefined },
    strokeWidth: { type: Number, default: undefined },
    width: { type: Number, default: 120 },
    type: { type: String as PropType<ProgressProps['type']>, default: undefined },
    success: { type: Object as PropType<SuccessProps>, default: undefined },
    size: { type: null as unknown as PropType<ProgressProps['size']>, default: undefined },
    steps: {
      type: [Number, Object] as PropType<number | { count: number; gap: number }>,
      default: undefined,
    },
    strokeColor: {
      type: [String, Array, Object] as PropType<string | string[] | Record<string, string>>,
      default: undefined,
    },
    percent: { type: Number, default: undefined },
    direction: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const uid = useId();

    return (): VNodeChild => {
      const { prefixCls, classNames, styles } = props;

      const mergedRailColor = (props.railColor ?? props.trailColor) as string | null;

      const [width, height] = getSize(props.size ?? props.width, 'circle');

      let strokeWidth = props.strokeWidth as number | undefined;
      if (strokeWidth === undefined) {
        strokeWidth = Math.max(getMinPercent(width), 6);
      }

      const circleStyle: Record<string, unknown> = {
        width: px(width),
        height: px(height),
        fontSize: px(width * 0.15 + 6),
      };

      const realGapDegree =
        props.gapDegree !== undefined ? props.gapDegree : props.type === 'dashboard' ? 75 : 0;

      const percentArray = getPercentage({ percent: props.percent, success: props.success }) as [
        number,
        number,
      ];
      const gapPos = computed((): GapPosition | undefined => {
        const mergedPlacement =
          (props.gapPlacement ?? props.gapPosition) ||
          (props.type === 'dashboard' ? 'bottom' : undefined);
        const isRTL = props.direction === 'rtl';
        switch (mergedPlacement) {
          case 'start':
            return isRTL ? 'right' : 'left';
          case 'end':
            return isRTL ? 'left' : 'right';
          default:
            return mergedPlacement;
        }
      }).value;

      const isGradient = isPlainObject(props.strokeColor);
      const strokeColor = getStrokeColor({
        success: props.success,
        strokeColor: props.strokeColor as string | null,
      });

      const gradientId = `${uid}-gradient`;

      // ---- 公共几何 ----
      const halfSize = VIEW_BOX_SIZE / 2;
      const radius = halfSize - strokeWidth / 2;
      const perimeter = Math.PI * 2 * radius;
      const rotateDeg = realGapDegree > 0 ? 90 + realGapDegree / 2 : -90;
      const perimeterWithoutGap = perimeter * ((360 - realGapDegree) / 360);

      // ---- steps（circle-steps：分段弧）----
      const stepCount = props.steps
        ? typeof props.steps === 'object'
          ? props.steps.count
          : props.steps
        : 0;
      const stepGap = props.steps && typeof props.steps === 'object' ? props.steps.gap : 2;

      const railNode = !stepCount
        ? h('circle', {
            class: clsx(`${prefixCls}-circle-rail`, classNames.rail),
            r: radius,
            cx: halfSize,
            cy: halfSize,
            'stroke-linecap': isGradient ? 'butt' : props.strokeLinecap,
            'stroke-width': strokeWidth as number,
            style: getCircleStyle(
              perimeter,
              perimeterWithoutGap,
              0,
              100,
              rotateDeg,
              realGapDegree,
              gapPos,
              mergedRailColor,
              isGradient ? 'butt' : (props.strokeLinecap as string),
              strokeWidth as number,
            ),
          })
        : null;

      const getStepStrokeList = (): VNodeChild[] => {
        const current = Math.round(stepCount * (percentArray[1] / 100));
        const stepPtg = 100 / stepCount;
        let stackPtg = 0;
        return Array.from({ length: stepCount }, (_, index) => {
          const color = index <= current - 1 ? strokeColor[1] : mergedRailColor;
          const circleStyleForStack = getCircleStyle(
            perimeter,
            perimeterWithoutGap,
            stackPtg,
            stepPtg,
            rotateDeg,
            realGapDegree,
            gapPos,
            typeof color === 'string' ? color : null,
            'butt',
            strokeWidth as number,
            stepGap,
          );
          stackPtg +=
            ((perimeterWithoutGap - circleStyleForStack.strokeDashoffset + stepGap) * 100) /
            perimeterWithoutGap;
          return h('circle', {
            key: index,
            class: clsx(`${prefixCls}-circle-path`, classNames.track),
            r: radius,
            cx: halfSize,
            cy: halfSize,
            stroke: typeof color === 'string' ? color : undefined,
            'stroke-width': strokeWidth as number,
            opacity: 1,
            style: { ...circleStyleForStack, ...styles.track },
          });
        });
      };

      // ---- 普通分段（主 + success，逆序渲染）----
      const getStrokeList = (): VNodeChild[] => {
        const percentList = props.steps ? [percentArray[1]] : percentArray;
        const colorList = props.steps ? [strokeColor[1]] : strokeColor;
        let stackPtg = 0;
        const nodes = percentList.map((ptg, index) => {
          const color = colorList[index] ?? colorList[colorList.length - 1];
          const circleStyleForStack = getCircleStyle(
            perimeter,
            perimeterWithoutGap,
            stackPtg,
            ptg,
            rotateDeg,
            realGapDegree,
            gapPos,
            (color as string | Record<string, string>) ?? null,
            isGradient ? 'butt' : (props.strokeLinecap as string),
            strokeWidth as number,
          );
          stackPtg += ptg;
          const isColorGradient = color !== null && typeof color === 'object';
          const circleNode = h('circle', {
            class: clsx(`${prefixCls}-circle-path`, classNames.track),
            r: radius,
            cx: halfSize,
            cy: halfSize,
            stroke: isColorGradient ? '#FFF' : (color as string | undefined),
            'stroke-linecap': isGradient ? 'butt' : props.strokeLinecap,
            'stroke-width': strokeWidth as number,
            opacity: ptg === 0 ? 0 : 1,
            style: { ...circleStyleForStack, ...styles.track },
          });
          if (!isColorGradient) return circleNode;

          // PtgCircle 的 gradient 方案：mask 包 path + foreignObject 叠加渐变
          const grad = color as Record<string, string>;
          const maskId = `${gradientId}-conic`;
          const fromDeg = realGapDegree ? `${180 + realGapDegree / 2}deg` : '0deg';
          const conicColors = getPtgColors(grad, (360 - realGapDegree) / 360);
          const linearColors = getPtgColors(grad, 1);
          const conicColorBg = `conic-gradient(from ${fromDeg}, ${conicColors.join(', ')})`;
          const linearColorBg = `linear-gradient(to ${realGapDegree ? 'bottom' : 'top'}, ${linearColors.join(', ')})`;
          return [
            h('mask', { id: maskId }, [circleNode]),
            h(
              'foreignObject',
              { x: 0, y: 0, width: VIEW_BOX_SIZE, height: VIEW_BOX_SIZE, mask: `url(#${maskId})` },
              [
                h('div', { style: { width: '100%', height: '100%', background: linearColorBg } }, [
                  h('div', { style: { width: '100%', height: '100%', background: conicColorBg } }),
                ]),
              ],
            ),
          ];
        });
        return nodes.reverse().flat();
      };

      const svg = h(
        'svg',
        {
          class: `${prefixCls}-circle`,
          viewBox: `0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`,
          role: 'presentation',
        },
        [railNode, stepCount ? getStepStrokeList() : getStrokeList()],
      );

      const indicator = slots.default?.();

      const node = h(
        'div',
        {
          class: clsx(
            `${prefixCls}-body`,
            { [`${prefixCls}-circle-gradient`]: isGradient },
            classNames.body,
          ),
          style: { ...circleStyle, ...styles.body },
        },
        [svg, !(width <= 20) ? (indicator ?? undefined) : undefined],
      );

      // 小尺寸（≤20px）：indicator 经 Tooltip 展示（antd 逐字）。本仓 Tooltip 的
      // title prop 收窄 String（C8-R2）—— indicator 是 VNode ⇒ 走 `#title` 插槽
      if (width <= 20) {
        return h(Tooltip, {}, { default: () => node, title: () => indicator });
      }
      return node;
    };
  },
});
