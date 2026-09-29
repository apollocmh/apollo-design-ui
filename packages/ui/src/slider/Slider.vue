<script lang="ts">
/**
 * Slider 主实现 —— antd 6.6.4 `es/slider/index.js`（薄壳 232 行）
 * + rc-slider@1.1.1 `es/Slider.js`（内核 453 行）的 Vue 等价物。
 *
 * 判据逐条见 `docs/analysis/slider.md`；文件分工见其 §1。
 *
 * ── 三层合一（与上游一致）──────────────────────────────────────────────────────
 *   ① 壳层（antd）：orientation/vertical 归一、useMergeSemantic、Tooltip 包装、
 *      RTL 下 reverse 取反、5 条 deprecated 告警、SliderInternalContext 注入；
 *   ② 状态机（rc）：rawValues 归一 / marks 归一 / disabled 两态 / formatValue + offsetValues /
 *      事件链（beforeChange → change → changeComplete）/ 点击改值 / 键盘推进 /
 *      dragging 与 `-lock` 类 / included 区间 / expose（focus|blur）/ SliderContext provide；
 *   ③ 表现层：`Handles` / `Tracks` / `Steps` / `Marks`（各自一个文件）。
 *
 * ⚠️ Vue 化差异（已登记 COMPATIBILITY）：
 *   - `value` + `onChange` → `v-model:value`（C11：`update:value` 与 `change` 同发）；
 *   - `handleRender` / `activeHandleRender` → **scoped slot**（`#handle` / `#activeHandle`；
 *     默认的 Tooltip 包装由内部 `#wrapper` 槽承担 —— 见 Handles/Handle.ts 判据 7）；
 *   - `flushSync` 无对应物（D74 判例：Vue 响应式同步即等价）；
 *   - Tooltip 用本仓实现（antd 用自己的 Tooltip）。
 */

import { isNumber, isVNode, useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  type PropType,
  provide,
  ref,
  shallowRef,
  watch,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useOrientation } from '../_internal/use-orientation';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import {
  type NormalizedMark,
  type SliderContextValue,
  sliderContextKey,
  type UnstableSliderContextValue,
  unstableSliderContextKey,
} from './context';
import Handles from './Handles/index';
import { useDrag } from './hooks/use-drag';
import { getClosestEnabledHandleIndex, useOffset } from './hooks/use-offset';
import { useDisabled as useHandleDisabled, useRange } from './hooks/use-range';
import type {
  SliderFormatter,
  SliderHandleInfo,
  SliderMarks,
  SliderProps,
  SliderSemanticClassNames,
  SliderSemanticStyles,
  SliderTooltipProps,
  SliderValue,
} from './interface';
import Marks from './Marks/index';
import SliderTooltip from './SliderTooltip';
import Steps from './Steps/index';
import Tracks from './Tracks/index';

/** rc 逐字的默认格式化：数字 → 字符串，否则空串。 */
function getTipFormatter(tipFormatter: SliderFormatter | undefined): SliderFormatter {
  if (tipFormatter || tipFormatter === null) {
    return tipFormatter;
  }
  return (val?: number) => (isNumber(val) ? val.toString() : '');
}

export default defineComponent({
  name: 'ASlider',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<SliderProps['style']>, default: undefined },
    id: { type: String, default: undefined },
    disabled: { type: [Boolean, Array] as PropType<boolean | boolean[]>, default: undefined },
    keyboard: { type: Boolean, default: undefined },
    autoFocus: { type: Boolean, default: undefined },
    allowCross: { type: Boolean, default: undefined },
    pushable: { type: [Boolean, Number] as PropType<boolean | number>, default: undefined },
    reverse: { type: Boolean, default: undefined },
    vertical: { type: Boolean, default: undefined },
    orientation: { type: String as PropType<SliderProps['orientation']>, default: undefined },
    included: { type: Boolean, default: undefined },
    startPoint: { type: Number, default: undefined },
    marks: { type: Object as PropType<SliderMarks>, default: undefined },
    dots: { type: Boolean, default: undefined },
    dotStyle: { type: [Object, Function] as PropType<SliderProps['dotStyle']>, default: undefined },
    activeDotStyle: {
      type: [Object, Function] as PropType<SliderProps['activeDotStyle']>,
      default: undefined,
    },
    track: { type: Boolean, default: undefined },
    formatter: {
      type: Function as unknown as PropType<SliderFormatter>,
      default: undefined,
    },
    tooltip: { type: Object as PropType<SliderTooltipProps>, default: undefined },
    tabIndex: { type: [Number, Array] as PropType<number | number[]>, default: undefined },
    ariaLabelForHandle: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
    ariaLabelledByForHandle: {
      type: [String, Array] as PropType<string | string[]>,
      default: undefined,
    },
    ariaRequired: { type: Boolean, default: undefined },
    ariaValueTextFormatterForHandle: {
      type: [Function, Array] as PropType<SliderProps['ariaValueTextFormatterForHandle']>,
      default: undefined,
    },
    classNames: { type: Object as PropType<SliderSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<SliderSemanticStyles>, default: undefined },
    trackStyle: {
      type: [Object, Array] as PropType<SliderProps['trackStyle']>,
      default: undefined,
    },
    handleStyle: {
      type: [Object, Array] as PropType<SliderProps['handleStyle']>,
      default: undefined,
    },
    railStyle: { type: Object as PropType<SliderProps['railStyle']>, default: undefined },
    // 值域
    range: { type: [Boolean, Object] as PropType<SliderProps['range']>, default: undefined },
    value: { type: [Number, Array] as PropType<SliderValue>, default: undefined },
    defaultValue: { type: [Number, Array] as PropType<SliderValue>, default: undefined },
    count: { type: Number, default: undefined },
    /** ⚠️ 内核参数（`step` 的 `null` 语义必须保住：`null` = 只按 marks 走）。 */
    step: { type: Number as PropType<number | null>, default: undefined },
    /** 语义合并用的合并后 props（antd 会把它交给函数式语义槽）。 */
    min: { type: Number, default: undefined },
    max: { type: Number, default: undefined },
  },
  emits: {
    'update:value': (_value: SliderValue) => true,
    change: (_value: SliderValue) => true,
    changeComplete: (_value: SliderValue) => true,
    beforeChange: (_value: SliderValue) => true,
    focus: (_event: FocusEvent, _index: number) => true,
    blur: (_event: FocusEvent, _index: number) => true,
  },
  setup(props, { slots, attrs, emit, expose }) {
    const context = useComponentConfig('slider');
    const direction = useDirection();
    const contextDisabled = useDisabled(props.disabled as boolean | undefined);

    const contextSemantic = context as unknown as {
      classNames?: SliderSemanticClassNames;
      styles?: SliderSemanticStyles;
      className?: string;
      style?: SliderProps['style'];
      getPrefixCls: (suffix?: string, custom?: string) => string;
      getPopupContainer?: (trigger: HTMLElement) => HTMLElement;
    };

    // ---- orientation 归一（判断链：orientation → vertical → direction）----
    const orientationPair = useOrientation(
      computed(() => props.orientation),
      computed(() => props.vertical),
      computed(() => undefined),
    );
    const mergedVertical = computed(() => orientationPair.value[1]);
    // antd 逐字告警：`vertical` 已废弃、请用 `orientation`
    watch(
      () => props.vertical,
      (vertical) => {
        if (vertical !== undefined && import.meta.env?.DEV) {
          console.warn(
            '[apollo: Slider] `vertical` is deprecated, please use `orientation` instead.',
          );
        }
      },
      { immediate: true },
    );

    const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);

    // ---- 语义合并（antd：useMergeSemantic([context, props])）----
    // ⚠️ 返回**对象**（`{classNames, styles}`），不是元组（empty/flex 同判）
    const mergedSemantic = useMergeSemantic(
      [computed(() => contextSemantic.classNames), computed(() => props.classNames)],
      [
        computed(() => contextSemantic.styles),
        computed(() => semanticRootStyle(contextSemantic.style)),
        computed(() => props.styles),
        computed(() => semanticRootStyle(props.style)),
      ],
      props,
    );
    const mergedClassNames = mergedSemantic.classNames;
    const mergedStyles = mergedSemantic.styles;

    const prefixCls = computed(() => contextSemantic.getPrefixCls('slider', props.prefixCls));
    const isRTL = computed(() => (direction.value ?? 'ltr') === 'rtl');

    // ---- 值（`useControlledValue` = rc 的 useControlledState）----
    const [mergedValue, setValue] = useControlledValue<SliderValue | undefined>({
      defaultValue: props.defaultValue,
      getValue: () => props.value,
    });

    // ---- range 五开关 ----
    const { rangeEnabled, rangeEditable, rangeDraggableTrack, minCount, maxCount } = useRange(
      computed(() => props.range),
    );

    const mergedMin = computed(() => (Number.isFinite(props.min) ? (props.min as number) : 0));
    const mergedMax = computed(() => (Number.isFinite(props.max) ? (props.max as number) : 100));

    const mergedStep = computed<number | null>(() => {
      const step = props.step;
      if (step === undefined) return 1;
      if (step === null) return null;
      return step <= 0 ? 1 : step;
    });

    /** `pushable` 归一：`true` ⇒ `step`；数字 ⇒ 自身；`false` ⇒ `false`（⚠️ `step === null` 时 `true` 退化成 false）。 */
    const mergedPush = computed<number | boolean | null>(() => {
      const pushable = props.pushable;
      if (pushable === undefined || typeof pushable === 'boolean') {
        return pushable ? (mergedStep.value ?? false) : false;
      }
      return pushable >= 0 ? pushable : false;
    });

    // ---- marks 归一：过滤（label 为 falsy 且非 number）+ 升序 ----
    const markList = computed<NormalizedMark[]>(() => {
      const record = props.marks ?? {};
      return Object.keys(record)
        .map((key) => {
          const mark = record[key] as unknown;
          const value = Number(key);
          if (mark && typeof mark === 'object' && !isVNode(mark as never)) {
            const obj = mark as { label?: unknown; style?: NormalizedMark['style'] };
            if ('label' in obj || 'style' in obj) {
              return { value, style: obj.style, label: obj.label as never };
            }
          }
          return { value, label: mark as never };
        })
        .filter(({ label }) => label || typeof label === 'number')
        .sort((a, b) => a.value - b.value);
    });

    // ---- disabled 两态 ----
    const { isHandleDisabled, getDisabledState } = useHandleDisabled(mergedDisabled);
    const disabledState = computed(() => getDisabledState(rawValuesOf()));
    const disabled = computed(() => disabledState.value[0]);
    const hasDisabledHandle = computed(() => disabledState.value[1]);
    /** `editable` 的前提是「没有任何禁用把手」。 */
    const effectiveRangeEditable = computed(() => rangeEditable.value && !hasDisabledHandle.value);

    // ---- 几何与量化 ----
    const { formatValue, offsetValues } = useOffset({
      min: mergedMin,
      max: mergedMax,
      step: mergedStep,
      markList,
      allowCross: computed(() => props.allowCross ?? true),
      pushable: mergedPush,
      isHandleDisabled,
    });

    /** 值归一（rc 的 `rawValues`）：`null` ⇒ 空、range 补齐、逐值量化。 */
    function rawValuesOf(): number[] {
      const mv = mergedValue.value;
      const valueList = mv === null || mv === undefined ? [] : Array.isArray(mv) ? mv : [mv];
      const val0 = valueList[0] ?? mergedMin.value;
      let returnValues: number[] = mv === null ? [] : [val0];

      if (rangeEnabled.value) {
        returnValues = [...valueList];
        if (props.count !== undefined || mv === undefined) {
          const pointCount = props.count !== undefined && props.count >= 0 ? props.count + 1 : 2;
          returnValues = returnValues.slice(0, pointCount);
          while (returnValues.length < pointCount) {
            returnValues.push(returnValues[returnValues.length - 1] ?? mergedMin.value);
          }
        }
        returnValues.sort((a, b) => a - b);
      }
      return returnValues.map((val) => formatValue(val));
    }
    const rawValues = computed<number[]>(() => rawValuesOf());

    // ---- 事件链：beforeChange（调用方显式发）→ change/update:value → changeComplete ----
    const getTriggerValue = (values: number[]): SliderValue =>
      rangeEnabled.value ? values : (values[0] ?? mergedMin.value);

    const triggerChange = (nextValues: number[]): void => {
      const cloneNextValues = [...nextValues].sort((a, b) => a - b);
      const current = rawValues.value;
      const same =
        cloneNextValues.length === current.length &&
        cloneNextValues.every((val, index) => val === current[index]);
      if (!same) {
        const next = getTriggerValue(cloneNextValues);
        emit('update:value', next);
        emit('change', next);
      }
      setValue(cloneNextValues);
    };

    const finishChange = (draggingDeleteFlag: boolean): void => {
      if (draggingDeleteFlag) {
        handlesRef.value?.hideHelp?.();
      }
      emit('changeComplete', getTriggerValue(rawValues.value));
    };

    // ---- tooltip 三态 open ----
    const hoverOpen = ref(false);
    const focusOpen = ref(false);
    const tooltipProps = computed<SliderTooltipProps>(() => ({ ...(props.tooltip ?? {}) }));
    const lockOpen = computed(() => tooltipProps.value.open);
    const activeOpen = computed(
      () => (hoverOpen.value || focusOpen.value) && lockOpen.value !== false,
    );
    const mergedTipFormatter = computed(() => getTipFormatter(props.formatter));

    // 文档级 mouseup：延迟 1 帧关掉 focusOpen（点一下即隐藏 tooltip）
    const onDocumentMouseUp = (): void => {
      requestAnimationFrame(() => {
        focusOpen.value = false;
      });
    };
    onMounted(() => document.addEventListener('mouseup', onDocumentMouseUp));
    onBeforeUnmount(() => document.removeEventListener('mouseup', onDocumentMouseUp));

    // ---- 拖拽 ----
    const containerRef = ref<HTMLElement | null>(null);
    const handlesRef = shallowRef<{
      focus?: (index: number) => void;
      hideHelp?: () => void;
    } | null>(null);
    const unstable = inject(unstableSliderContextKey, undefined) as
      | UnstableSliderContextValue
      | undefined;

    const sliderDirection = computed<'ltr' | 'rtl' | 'ttb' | 'btt'>(() => {
      const reverse = isRTL.value && !mergedVertical.value ? !props.reverse : props.reverse;
      if (mergedVertical.value) return reverse ? 'ttb' : 'btt';
      return reverse ? 'rtl' : 'ltr';
    });

    const {
      draggingIndex,
      draggingDelete,
      cacheValues,
      onStartMove,
      cancel: cancelDrag,
    } = useDrag({
      containerRef,
      direction: sliderDirection,
      rawValues,
      min: mergedMin,
      max: mergedMax,
      formatValue,
      triggerChange,
      finishChange,
      offsetValues,
      editable: effectiveRangeEditable,
      minCount,
      isHandleDisabled,
      onDragStart: (info) => unstable?.onDragStart?.(info),
      onDragChange: (info) => unstable?.onDragChange?.(info),
    });

    /**
     * 渲染用的值：拖拽期间用 `cacheValues`，但**必须**满足 rc 的差异判据
     * （多重集差异 ≤ `editable ? 1 : 0`），否则回落到 `rawValues`。
     */
    const renderValues = computed<number[]>(() => {
      if (draggingIndex.value === -1) return rawValues.value;
      const counts: Record<number, number> = {};
      cacheValues.value.forEach((val) => {
        counts[val] = (counts[val] || 0) + 1;
      });
      rawValues.value.forEach((val) => {
        counts[val] = (counts[val] || 0) - 1;
      });
      const diffCount = Object.values(counts).reduce((prev, next) => prev + Math.abs(next), 0);
      return diffCount <= (effectiveRangeEditable.value ? 1 : 0)
        ? cacheValues.value
        : rawValues.value;
    });

    // ---- included 区间（Track / Dot / Mark 的「激活」判据）----
    const sortedRenderValues = computed(() => [...renderValues.value].sort((a, b) => a - b));
    const includedStart = computed(() =>
      rangeEnabled.value ? (sortedRenderValues.value[0] ?? mergedMin.value) : mergedMin.value,
    );
    const includedEnd = computed(() => {
      if (rangeEnabled.value) {
        return sortedRenderValues.value[sortedRenderValues.value.length - 1] ?? mergedMax.value;
      }
      return sortedRenderValues.value[0] ?? mergedMin.value;
    });

    // ---- 点击/按键改值 ----
    const changeToCloseValue = (newValue: number, e?: MouseEvent | TouchEvent): void => {
      if (disabled.value) return;
      const currentValues = rawValues.value;
      const valueIndex = currentValues.length
        ? getClosestEnabledHandleIndex(
            currentValues,
            newValue,
            mergedMin.value,
            mergedMax.value,
            mergedPush.value,
            isHandleDisabled,
          )
        : 0;
      if (valueIndex === -1) return;

      const cloneNextValues = [...currentValues];
      let valueBeforeIndex = 0;
      const valueDist = currentValues.length
        ? Math.abs(newValue - (currentValues[valueIndex] ?? mergedMin.value))
        : mergedMax.value - mergedMin.value;
      currentValues.forEach((val, index) => {
        if (val < newValue) valueBeforeIndex = index;
      });
      let focusIndex = valueIndex;
      if (
        effectiveRangeEditable.value &&
        valueDist !== 0 &&
        (!maxCount.value || currentValues.length < maxCount.value)
      ) {
        cloneNextValues.splice(valueBeforeIndex + 1, 0, newValue);
        focusIndex = valueBeforeIndex + 1;
      } else {
        cloneNextValues[valueIndex] = newValue;
        focusIndex = valueIndex;
      }
      if (rangeEnabled.value && !currentValues.length && props.count === undefined) {
        cloneNextValues.push(newValue);
      }

      const nextValue = getTriggerValue(cloneNextValues);
      emit('beforeChange', nextValue);
      triggerChange(cloneNextValues);
      if (e) {
        (document.activeElement as HTMLElement | null)?.blur?.();
        handlesRef.value?.focus?.(focusIndex);
        onStartMove(e, focusIndex, cloneNextValues);
      } else {
        // 键盘点击 mark 的路径：不发 beforeChange，只 onChange + onChangeComplete
        emit('changeComplete', nextValue);
      }
    };

    const onSliderMouseDown = (e: MouseEvent): void => {
      e.preventDefault();
      const rect = containerRef.value?.getBoundingClientRect();
      if (!rect) return;
      const { width, height, left, top, bottom, right } = rect;
      let percent: number;
      switch (sliderDirection.value) {
        case 'btt':
          percent = (bottom - e.clientY) / height;
          break;
        case 'ttb':
          percent = (e.clientY - top) / height;
          break;
        case 'rtl':
          percent = (right - e.clientX) / width;
          break;
        default:
          percent = (e.clientX - left) / width;
      }
      const nextValue = mergedMin.value + percent * (mergedMax.value - mergedMin.value);
      changeToCloseValue(formatValue(nextValue), e);
    };

    /** 键盘推进（方向键/Home/End/PageUp/Down）—— 走 `offsetValues` 的 `unit` 模式。 */
    const keyboardFocus = shallowRef<{ value: number; index: number } | null>(null);
    const onHandleOffsetChange = (offset: number | 'min' | 'max', valueIndex: number): void => {
      if (disabled.value || isHandleDisabled(valueIndex)) return;
      const next = offsetValues(rawValues.value, offset, valueIndex);
      emit('beforeChange', getTriggerValue(rawValues.value));
      triggerChange(next.values);
      keyboardFocus.value = { value: next.value, index: valueIndex };
    };
    watch(keyboardFocus, (kv) => {
      if (kv) {
        const valueIndex =
          rawValues.value[kv.index] === kv.value ? kv.index : rawValues.value.indexOf(kv.value);
        if (valueIndex >= 0) handlesRef.value?.focus?.(valueIndex);
      }
      keyboardFocus.value = null;
    });

    /** 拖拽删除（`range.editable` + `minCount` 下限）。 */
    const onDelete = (index: number): void => {
      if (
        disabled.value ||
        !effectiveRangeEditable.value ||
        rawValues.value.length <= minCount.value
      ) {
        return;
      }
      const cloneNextValues = [...rawValues.value];
      cloneNextValues.splice(index, 1);
      emit('beforeChange', getTriggerValue(cloneNextValues));
      triggerChange(cloneNextValues);
      handlesRef.value?.hideHelp?.();
      handlesRef.value?.focus?.(Math.max(0, index - 1));
    };

    /** 整轨拖拽（`draggableTrack`；`step === null` 时禁用并告警）。 */
    const mergedDraggableTrack = computed(() => {
      if (rangeDraggableTrack.value && mergedStep.value === null) {
        if (import.meta.env?.DEV) {
          console.warn('[apollo: Slider] `draggableTrack` is not supported when `step` is `null`.');
        }
        return false;
      }
      return rangeDraggableTrack.value;
    });

    /** range 且未锁定 open ⇒ 用「活动把手替身」挂唯一的 tooltip。 */
    const useActiveTooltipHandle = computed(() => rangeEnabled.value && !lockOpen.value);

    // ---- 上下文（Proxy 桥：读时取最新值，等价 rc 的「每次渲染重建对象」）----
    const sliderContextValue: SliderContextValue = new Proxy({} as SliderContextValue, {
      get(_t, key) {
        const next: SliderContextValue = {
          min: mergedMin.value,
          max: mergedMax.value,
          direction: sliderDirection.value,
          disabled: disabled.value,
          keyboard: props.keyboard ?? true,
          step: mergedStep.value,
          included: props.included ?? true,
          includedStart: includedStart.value,
          includedEnd: includedEnd.value,
          range: rangeEnabled.value,
          tabIndex: props.tabIndex ?? 0,
          ariaLabelForHandle: props.ariaLabelForHandle,
          ariaLabelledByForHandle: props.ariaLabelledByForHandle,
          ariaRequired: props.ariaRequired,
          ariaValueTextFormatterForHandle: props.ariaValueTextFormatterForHandle,
          styles: mergedStyles.value,
          classNames: mergedClassNames.value,
          isHandleDisabled,
        };
        return (next as unknown as Record<string | symbol, unknown>)[key];
      },
    });
    provide(sliderContextKey, sliderContextValue);

    // ---- expose（antd 的 SliderRef）----
    expose({
      focus: () => handlesRef.value?.focus?.(0),
      blur: () => {
        const activeElement = document.activeElement as HTMLElement | null;
        if (containerRef.value?.contains(activeElement)) {
          activeElement?.blur?.();
        }
      },
    });

    onMounted(() => {
      if (props.autoFocus) handlesRef.value?.focus?.(0);
    });
    onBeforeUnmount(() => cancelDrag());

    /** Tooltip 的位置：横向 `top`；纵向 `isRTL ? left : right`（antd 逐字）。 */
    const tooltipPlacement = computed(() => {
      if (tooltipProps.value.placement) return tooltipProps.value.placement;
      if (!mergedVertical.value) return 'top';
      return isRTL.value ? 'left' : 'right';
    });

    return () => {
      const p = prefixCls.value;
      const values = renderValues.value;

      const handleNodes = h(
        Handles,
        {
          ref: (node: unknown) => {
            handlesRef.value = (node ?? null) as {
              focus?: (index: number) => void;
              hideHelp?: () => void;
            } | null;
          },
          prefixCls: p,
          style: props.handleStyle,
          values,
          draggingIndex: draggingIndex.value,
          draggingDelete: draggingDelete.value,
          onStartMove,
          onOffsetChange: onHandleOffsetChange,
          onChangeComplete: () => finishChange(false),
          onDelete: effectiveRangeEditable.value ? onDelete : undefined,
          onFocus: (e: FocusEvent, index: number) => {
            focusOpen.value = true;
            emit('focus', e, index);
          },
          onBlur: (e: FocusEvent, index: number) => {
            focusOpen.value = false;
            emit('blur', e, index);
          },
          onMouseEnterChange: () => {
            hoverOpen.value = true;
            if (useActiveTooltipHandle.value) focusOpen.value = true;
          },
          onMouseLeaveChange: () => {
            hoverOpen.value = false;
          },
          onMouseDownChange: () => {
            focusOpen.value = true;
          },
          hasActiveHandle: useActiveTooltipHandle.value,
        },
        {
          // 自定义把手（rc 的 `handleRender` 的「节点替换」半边）
          handle: slots.handle as never,
          // 活动把手替身（rc 的 `activeHandleRender`）
          activeHandle: slots.activeHandle as never,
          // 默认包装：把每个把手包进 SliderTooltip（rc 的默认 handleRender 的「包装」半边）
          wrapper: ({ node, value, index }: { node: unknown; value?: number; index: number }) => {
            if (useActiveTooltipHandle.value) {
              return node;
            }
            const open =
              (!!lockOpen.value || activeOpen.value) && mergedTipFormatter.value !== null;
            return h(
              SliderTooltip as never,
              {
                key: index,
                prefixCls: p,
                tooltipProps: tooltipProps.value,
                title:
                  mergedTipFormatter.value && isNumber(value)
                    ? mergedTipFormatter.value(value)
                    : undefined,
                open,
                placement: tooltipPlacement.value,
                getPopupContainer:
                  tooltipProps.value.getPopupContainer ?? contextSemantic.getPopupContainer,
              } as never,
              { default: () => node as never },
            );
          },
        } as never,
      );

      const rootClassName = [
        // ⚠️ 基础类名必须在最前（rc：clsx(prefixCls, className, …)）
        p,
        props.className,
        contextSemantic.className,
        mergedClassNames.value.root,
        props.rootClassName,
        isRTL.value ? `${p}-rtl` : '',
        draggingIndex.value !== -1 ? `${p}-lock` : '',
        disabled.value ? `${p}-disabled` : '',
        mergedVertical.value ? `${p}-vertical` : `${p}-horizontal`,
        markList.value.length ? `${p}-with-marks` : '',
      ]
        .filter(Boolean)
        .join(' ');

      return h(
        'div',
        {
          ...(attrs as Record<string, unknown>),
          ref: containerRef,
          class: rootClassName,
          style: { ...mergedStyles.value.root },
          id: props.id,
          onMousedown: onSliderMouseDown,
        },
        [
          h('div', {
            class: [`${p}-rail`, mergedClassNames.value.rail].filter(Boolean).join(' '),
            style: { ...props.railStyle, ...mergedStyles.value.rail },
          }),
          props.track === false
            ? null
            : h(Tracks, {
                prefixCls: p,
                style: props.trackStyle,
                values: rawValues.value,
                startPoint: props.startPoint,
                onStartMove: mergedDraggableTrack.value ? onStartMove : undefined,
              }),
          h(Steps, {
            prefixCls: p,
            marks: markList.value,
            dots: props.dots ?? false,
            style: props.dotStyle,
            activeStyle: props.activeDotStyle,
          }),
          handleNodes,
          h(Marks, {
            prefixCls: p,
            marks: markList.value,
            onClick: (value: number) => changeToCloseValue(value),
          }),
        ],
      );
    };
  },
});
</script>
