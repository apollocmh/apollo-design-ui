/**
 * Progress —— antd `progress/progress.tsx`（250 行）的 Vue 版主组件。
 *
 * ## 文件头判据
 *
 * 1. **三形态分发**：line（纯线）/ line+steps / circle|dashboard（SVG 内核自研）。
 * 2. **role="progressbar"** + aria-valuenow（parseInt(success?.percent ?? percent)）。
 * 3. **status 推导**：非法 status 且 percent>=100 ⇒ success；否则 status||normal。
 * 4. **indicator**：format || `${n}%`；exception/success ⇒ 图标（line 用 Filled 系列）；
 *    `-indicator-bright`（strokeColor 亮色且 inner，isLight 自研）。
 * 5. **warning ×4 deprecated**（width/trailColor/gapPosition/size="default"）+
 *    usage ×2（circle/dashboard 的 size 数组/对象）。
 * 6. **语义面** root/body/rail/track/indicator（context + 用户对象/函数式合并）。
 * 7. C8-R2：format/rounding 是 fn prop（数据通道）；antd children 无效（被显式
 *    progressInfo 覆盖），不收。
 */

import {
  CheckCircleFilled,
  CheckOutlined,
  CloseCircleFilled,
  CloseOutlined,
} from '@apollo-design/icons';
import { isPlainObject, useDevWarning } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, type VNodeChild, watchEffect } from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useConfigContext, useDirection } from '../config-provider/context';
import { clsx } from '../notification/engine/util';
import CircleEngine from './engine/Circle';
import LineEngine from './engine/Line';
import StepsEngine from './engine/Steps';
import type {
  ProgressProps,
  ProgressSemanticClassNames,
  ProgressSemanticStyles,
  ProgressStatus,
  ProgressType,
} from './interface';
import { getSize, getSuccessPercent, isLightColor, validProgress } from './utils';

const ProgressStatuses: readonly ProgressStatus[] = ['normal', 'exception', 'active', 'success'];
const ProgressTypes: readonly ProgressType[] = ['line', 'circle', 'dashboard'];

const ProgressComponent = defineComponent({
  name: 'AProgress',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<ProgressProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<ProgressProps['styles']>,
      default: undefined,
    },
    type: {
      type: String as PropType<ProgressType>,
      default: 'line',
    },
    percent: { type: Number, default: 0 },
    format: {
      type: Function as PropType<ProgressProps['format']>,
      default: undefined,
    },
    status: { type: String as PropType<ProgressStatus>, default: undefined },
    showInfo: { type: Boolean, default: true },
    strokeWidth: { type: Number, default: undefined },
    strokeLinecap: {
      type: String as PropType<ProgressProps['strokeLinecap']>,
      default: 'round',
    },
    strokeColor: {
      type: [String, Array, Object] as PropType<ProgressProps['strokeColor']>,
      default: undefined,
    },
    trailColor: { type: String, default: undefined },
    railColor: { type: String, default: undefined },
    width: { type: Number, default: undefined },
    success: { type: Object as PropType<ProgressProps['success']>, default: undefined },
    style: { type: [Object, String] as PropType<ProgressProps['style']>, default: undefined },
    gapDegree: { type: Number, default: undefined },
    gapPlacement: {
      type: String as PropType<ProgressProps['gapPlacement']>,
      default: undefined,
    },
    gapPosition: {
      type: String as PropType<ProgressProps['gapPosition']>,
      default: undefined,
    },
    size: { type: null as unknown as PropType<ProgressProps['size']>, default: undefined },
    steps: {
      type: [Number, Object] as PropType<ProgressProps['steps']>,
      default: undefined,
    },
    percentPosition: {
      type: Object as PropType<ProgressProps['percentPosition']>,
      default: undefined,
    },
    rounding: {
      type: Function as PropType<ProgressProps['rounding']>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const devWarning = useDevWarning('Progress');
    const { getPrefixCls } = useConfigContext();
    const direction = useDirection();

    const prefixCls = computed(() => getPrefixCls('progress', props.prefixCls));

    const percent = computed(() => props.percent ?? 0);
    const size = computed(() => props.size ?? 'medium');
    const type = computed(() => props.type ?? 'line');
    const showInfo = computed(() => props.showInfo ?? true);
    const percentPosition = computed(() => props.percentPosition ?? {});
    const { align: infoAlign = 'end', type: infoPosition = 'outer' } = percentPosition.value;

    // ---- Warning（antd 逐字）----
    watchEffect(() => {
      devWarning.deprecated(props.width === undefined, 'width', 'size');
      devWarning.deprecated(props.trailColor === undefined, 'trailColor', 'railColor');
      devWarning.deprecated(props.gapPosition === undefined, 'gapPosition', 'gapPlacement');
      devWarning.deprecated(size.value !== 'default', 'size="default"', 'size="medium"');

      if (type.value === 'circle' || type.value === 'dashboard') {
        if (Array.isArray(size.value)) {
          devWarning(
            false,
            'Type "circle" and "dashboard" do not accept array as `size`, please use number or preset size instead.',
          );
        } else if (isPlainObject(size.value)) {
          devWarning(
            false,
            'Type "circle" and "dashboard" do not accept object as `size`, please use number or preset size instead.',
          );
        }
      }
    });

    // ---- status 推导 ----
    const percentNumber = computed<number>(() => {
      const successPercent = getSuccessPercent({ success: props.success });
      return Number.parseInt(
        String(successPercent !== undefined ? (successPercent ?? 0) : (percent.value ?? 0)),
        10,
      );
    });

    const progressStatus = computed<ProgressStatus>(() => {
      if (!ProgressStatuses.includes(props.status!) && percentNumber.value >= 100) {
        return 'success';
      }
      return props.status || 'normal';
    });

    // ---- strokeColor 亮色判定 ----
    const strokeColorNotArray = computed(() =>
      Array.isArray(props.strokeColor) ? props.strokeColor[0] : props.strokeColor,
    );
    const strokeColorNotGradient = computed(() =>
      typeof props.strokeColor === 'string' || Array.isArray(props.strokeColor)
        ? props.strokeColor
        : undefined,
    );
    const strokeColorIsBright = computed(() => {
      const c = strokeColorNotArray.value;
      if (c) {
        const color =
          typeof c === 'string' ? c : (Object.values(c as Record<string, string>)[0] ?? '');
        return isLightColor(color);
      }
      return false;
    });

    // ---- 语义合并 ----
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      ProgressProps,
      ProgressSemanticClassNames,
      ProgressSemanticStyles
    >(
      [() => props.classNames as ProgressSemanticClassNames | undefined],
      [() => props.styles as ProgressSemanticStyles | undefined],
      props,
    );

    // ---- indicator ----
    const isLineType = computed(() => type.value === 'line');
    const isPureLineType = computed(() => isLineType.value && !props.steps);

    const progressInfo = computed<VNodeChild>(() => {
      if (!showInfo.value) {
        return null;
      }
      const successPercent = getSuccessPercent({ success: props.success });
      let text: VNodeChild;
      const textFormatter = props.format || ((number?: number) => `${number}%`);
      const isBrightInnerColor =
        isLineType.value && strokeColorIsBright.value && infoPosition === 'inner';
      if (
        infoPosition === 'inner' ||
        props.format ||
        (progressStatus.value !== 'exception' && progressStatus.value !== 'success')
      ) {
        text = textFormatter(validProgress(percent.value), validProgress(successPercent));
      } else if (progressStatus.value === 'exception') {
        text = isLineType.value ? h(CloseCircleFilled) : h(CloseOutlined);
      } else if (progressStatus.value === 'success') {
        text = isLineType.value ? h(CheckCircleFilled) : h(CheckOutlined);
      }

      return h(
        'span',
        {
          class: clsx(
            `${prefixCls.value}-indicator`,
            {
              [`${prefixCls.value}-indicator-bright`]: isBrightInnerColor,
              [`${prefixCls.value}-indicator-${infoAlign}`]: isPureLineType.value,
              [`${prefixCls.value}-indicator-${infoPosition}`]: isPureLineType.value,
            },
            mergedClassNames.value.indicator,
          ),
          style: mergedStyles.value.indicator,
          title: typeof text === 'string' ? text : undefined,
        },
        text ?? undefined,
      );
    });

    return () => {
      const pCls = prefixCls.value;
      const infoAlignCur = percentPosition.value.align ?? 'end';
      const infoPositionCur = percentPosition.value.type ?? 'outer';

      const sharedClassNames = mergedClassNames.value;
      const sharedStyles = mergedStyles.value;

      // ---- 形态分发 ----
      let progress: VNodeChild;
      if (type.value === 'line') {
        progress = props.steps
          ? h(
              StepsEngine,
              {
                prefixCls: pCls,
                classNames: sharedClassNames,
                styles: sharedStyles,
                size: size.value,
                steps: isPlainObject(props.steps)
                  ? (props.steps as { count: number }).count
                  : props.steps!,
                rounding: props.rounding,
                percent: percent.value,
                strokeWidth: props.strokeWidth ?? 8,
                strokeColor: strokeColorNotGradient.value as string | string[] | undefined,
                railColor: props.railColor,
                trailColor: props.trailColor,
              } as never,
              { default: () => progressInfo.value },
            )
          : h(
              LineEngine,
              {
                prefixCls: pCls,
                classNames: sharedClassNames,
                styles: sharedStyles,
                direction: direction.value,
                percent: percent.value,
                size: size.value,
                strokeWidth: props.strokeWidth,
                strokeColor: strokeColorNotArray.value as never,
                strokeLinecap: props.strokeLinecap ?? 'round',
                railColor: props.railColor,
                trailColor: props.trailColor,
                percentPosition: { align: infoAlignCur, type: infoPositionCur },
                success: props.success,
              } as never,
              { default: () => progressInfo.value },
            );
      } else {
        progress = h(
          CircleEngine,
          {
            prefixCls: pCls,
            classNames: sharedClassNames,
            styles: sharedStyles,
            railColor: props.railColor,
            trailColor: props.trailColor,
            strokeLinecap: props.strokeLinecap ?? 'round',
            gapPosition: props.gapPosition,
            gapPlacement: props.gapPlacement,
            gapDegree: props.gapDegree,
            width: props.width ?? 120,
            type: type.value,
            success: props.success,
            size: size.value,
            steps: props.steps,
            strokeColor: strokeColorNotArray.value as never,
            percent: percent.value,
            direction: direction.value,
          } as never,
          { default: () => progressInfo.value },
        );
      }

      const classString = clsx(
        pCls,
        `${pCls}-status-${progressStatus.value}`,
        {
          [`${pCls}-${type.value === 'dashboard' ? 'circle' : type.value}`]: type.value !== 'line',
          [`${pCls}-inline-circle`]:
            type.value === 'circle' && getSize(size.value, 'circle')[0] <= 20,
          [`${pCls}-line`]: isPureLineType.value,
          [`${pCls}-line-align-${infoAlignCur}`]: isPureLineType.value,
          [`${pCls}-line-position-${infoPositionCur}`]: isPureLineType.value,
          [`${pCls}-steps`]: props.steps,
          [`${pCls}-show-info`]: showInfo.value,
          [`${pCls}-small`]: size.value === 'small',
          [`${pCls}-rtl`]: direction.value === 'rtl',
        },
        props.className,
        props.rootClassName,
        mergedClassNames.value.root,
      );

      return h(
        'div',
        {
          ...attrs,
          style: { ...sharedStyles.root, ...(typeof props.style === 'object' ? props.style : {}) },
          class: classString,
          role: 'progressbar',
          'aria-valuenow': percentNumber.value,
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          // aria-label / aria-labelledby（antd AriaProps）走 attrs 透传 —— Vue 不把
          // aria-* 键识别为组件 prop，显式 undefined 会覆盖 attrs（L4 aria 用例抓出）
        },
        progress,
      );
    };
  },
});

export default ProgressComponent;
