<script lang="ts">
/** Vue Slider: accepted values, native input sessions, explicit handle slots and scoped static theme values. */
import { isEmptyVNode, isVNode, useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  inject,
  mergeProps,
  nextTick,
  onMounted,
  type PropType,
  provide,
  ref,
  type SlotsType,
  shallowRef,
  type VNodeChild,
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
  unstableSliderContextKey,
} from './context';
import Handles, { type HandlesRef } from './Handles/index';
import { resolveDragValues, useDrag } from './hooks/use-drag';
import { getClosestEnabledHandleIndex, useOffset } from './hooks/use-offset';
import { useDisabled as useHandleDisabled, useRange } from './hooks/use-range';
import type {
  SliderFormatter,
  SliderHandleInfo,
  SliderMarkObject,
  SliderMarks,
  SliderProps,
  SliderSemanticClassNames,
  SliderSemanticStyles,
  SliderSlots,
  SliderTooltipProps,
  SliderValue,
} from './interface';
import Marks from './Marks/index';
import SliderTooltip from './SliderTooltip';
import Steps from './Steps/index';
import Tracks from './Tracks/index';
import { useSliderTheme } from './use-slider-theme';

const isMarkObject = (value: unknown): value is SliderMarkObject =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  !isVNode(value) &&
  ('label' in value || 'style' in value);
const defaultFormatter = (value?: number) => (value === undefined ? '' : String(value));

export default defineComponent({
  name: 'ASlider',
  inheritAttrs: false,
  expose: ['focus', 'blur'],
  props: {
    prefixCls: { type: String, default: undefined },
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
      type: [Function, null] as PropType<SliderFormatter>,
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
    value: { type: [Number, Array] as PropType<SliderProps['value']>, default: undefined },
    defaultValue: { type: [Number, Array] as PropType<SliderProps['value']>, default: undefined },
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
    keydown: (_event: KeyboardEvent, _index: number) => true,
    keyup: (_event: KeyboardEvent, _index: number) => true,
  },
  slots: Object as SlotsType<SliderSlots>,
  setup(props, { slots, attrs, emit }) {
    const context = useComponentConfig<{
      className?: string;
      style?: import('vue').CSSProperties;
      classNames?: SliderSemanticClassNames;
      styles?: SliderSemanticStyles;
    }>('slider');
    const direction = useDirection();
    const contextDisabled = useDisabled();
    const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);
    const orientation = useOrientation(
      () => props.orientation,
      () => props.vertical,
      () => undefined,
    );
    const vertical = computed(() => orientation.value[1]);
    const isRTL = computed(() => direction.value === 'rtl');
    const prefixCls = computed(() => context.getPrefixCls('slider', props.prefixCls));
    const themeStyle = useSliderTheme(() => prefixCls.value);
    const semantic = useMergeSemantic<SliderProps, SliderSemanticClassNames, SliderSemanticStyles>(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
      props,
    );
    const { rangeEnabled, rangeEditable, rangeDraggableTrack, minCount, maxCount } = useRange(
      () => props.range,
    );
    const min = computed(() =>
      typeof props.min === 'number' && Number.isFinite(props.min) ? props.min : 0,
    );
    const max = computed(() =>
      typeof props.max === 'number' && Number.isFinite(props.max) ? props.max : 100,
    );
    const step = computed(() =>
      props.step === null
        ? null
        : typeof props.step === 'number' && Number.isFinite(props.step) && props.step > 0
          ? props.step
          : 1,
    );
    const push = computed(() =>
      typeof props.pushable === 'number'
        ? props.pushable >= 0
          ? props.pushable
          : false
        : props.pushable
          ? (step.value ?? false)
          : false,
    );
    const markList = computed<NormalizedMark[]>(() =>
      Object.entries(props.marks ?? {})
        .flatMap(([key, item]) => {
          const value = Number(key);
          if (!Number.isFinite(value) || value < min.value || value > max.value) return [];
          const mark = isMarkObject(item)
            ? { value, label: item.label, style: item.style }
            : { value, label: item };
          return isEmptyVNode(mark.label) ? [] : [mark];
        })
        .sort((a, b) => a.value - b.value),
    );
    const [value, setValue] = useControlledValue<SliderValue | null | undefined>({
      defaultValue: () => props.defaultValue,
      getValue: () => props.value,
    });
    const { isHandleDisabled, getDisabledState } = useHandleDisabled(mergedDisabled);
    const { formatValue, offsetValues } = useOffset({
      min,
      max,
      step,
      markList,
      allowCross: () => props.allowCross ?? true,
      pushable: push,
      isHandleDisabled,
    });
    const rawValues = computed(() => {
      const current = value.value;
      if (current === null) return [];
      const list = current === undefined ? [] : Array.isArray(current) ? [...current] : [current];
      if (!rangeEnabled.value) return [formatValue(list[0] ?? min.value)];
      if (props.count !== undefined || current === undefined) {
        const count = props.count !== undefined && props.count >= 0 ? props.count + 1 : 2;
        list.splice(count);
        while (list.length < count) list.push(list[list.length - 1] ?? min.value);
      }
      return list.sort((a, b) => a - b).map(formatValue);
    });
    const disabledState = computed(() => getDisabledState(rawValues.value));
    const disabled = computed(() => disabledState.value[0]);
    const editable = computed(() => rangeEditable.value && !disabledState.value[1]);
    const sliderDirection = computed(() => {
      const reversed = isRTL.value && !vertical.value ? !props.reverse : props.reverse;
      return vertical.value ? (reversed ? 'ttb' : 'btt') : reversed ? 'rtl' : 'ltr';
    });
    const containerRef = ref<HTMLElement | null>(null);
    const handlesRef = shallowRef<HandlesRef | null>(null);
    const unstable = inject(unstableSliderContextKey, undefined);
    const toValue = (values: number[]): SliderValue =>
      rangeEnabled.value ? [...values] : (values[0] ?? min.value);
    let session: 'drag' | 'keyboard' | null = null;
    let lastProposal: number[] | undefined;
    const resetSession = () => {
      session = null;
      lastProposal = undefined;
    };
    const triggerChange = (nextValues: number[]) => {
      const next = [...nextValues].sort((a, b) => a - b);
      const previous = lastProposal ?? rawValues.value;
      if (next.length === previous.length && next.every((item, index) => item === previous[index]))
        return;
      if (!lastProposal) emit('beforeChange', toValue(next));
      lastProposal = [...next];
      setValue(toValue(next));
      const request = toValue(next);
      emit('update:value', request);
      emit('change', request);
    };
    const finishChange = (deleting: boolean) => {
      const next = lastProposal;
      const wasDrag = session === 'drag';
      resetSession();
      if (deleting) handlesRef.value?.hideHelp();
      if (next) emit('changeComplete', toValue(next));
      if (wasDrag) {
        const originalIndex = draggingIndex.value;
        const dragged = draggingValue.value;
        void nextTick(() => {
          const root = containerRef.value;
          if (!root) return;
          const active = root.ownerDocument.activeElement;
          if (active !== root.ownerDocument.body && active && !root.contains(active)) return;
          const matching = dragged === null ? -1 : rawValues.value.lastIndexOf(dragged);
          handlesRef.value?.focus(
            matching >= 0
              ? matching
              : Math.max(0, Math.min(originalIndex, rawValues.value.length - 1)),
          );
        });
      }
    };
    const hoverOpen = ref(false);
    const focusOpen = ref(false);
    const {
      dragging,
      draggingIndex,
      draggingValue,
      draggingDelete,
      cacheValues,
      onStartMove,
      cancel: cancelDrag,
    } = useDrag({
      containerRef,
      direction: sliderDirection,
      rawValues,
      min,
      max,
      formatValue,
      triggerChange,
      finishChange,
      offsetValues,
      editable,
      minCount,
      isHandleDisabled,
      onCancel: resetSession,
      onDragStart: (info) => {
        session = 'drag';
        focusOpen.value = true;
        unstable?.onDragStart?.(info);
      },
      onDragChange: (info) => unstable?.onDragChange?.(info),
    });
    const renderValues = computed(() =>
      !dragging.value
        ? rawValues.value
        : resolveDragValues(rawValues.value, cacheValues.value, editable.value),
    );
    const sortedValues = computed(() => [...renderValues.value].sort((a, b) => a - b));
    const draggableTrack = computed(() => rangeDraggableTrack.value && step.value !== null);
    // Structural/configuration changes invalidate geometry and input ownership, not accepted model updates.
    watch(
      [
        rangeEnabled,
        editable,
        rangeDraggableTrack,
        minCount,
        maxCount,
        min,
        max,
        step,
        sliderDirection,
        () => props.count,
        () =>
          Array.isArray(mergedDisabled.value)
            ? mergedDisabled.value.join(',')
            : mergedDisabled.value,
        () => markList.value.map((mark) => mark.value).join(','),
      ],
      () => {
        cancelDrag();
        handlesRef.value?.hideHelp();
      },
      { flush: 'sync' },
    );
    watch(
      () => [
        props.vertical,
        props.trackStyle,
        props.handleStyle,
        props.railStyle,
        props.count,
        rangeDraggableTrack.value,
        step.value,
      ],
      () => {
        if (!import.meta.env?.DEV) return;
        if (props.vertical !== undefined)
          console.warn(
            '[apollo: Slider] `vertical` is deprecated, please use `orientation` instead.',
          );
        if (rangeDraggableTrack.value && step.value === null)
          console.warn('[apollo: Slider] `draggableTrack` is not supported when `step` is `null`.');
      },
      { immediate: true },
    );
    const changeToCloseValue = (requested: number, event?: MouseEvent | TouchEvent) => {
      if (disabled.value) return;
      const values = rawValues.value;
      if (
        editable.value &&
        values.length === 0 &&
        maxCount.value !== undefined &&
        maxCount.value <= 0
      )
        return;
      const index = values.length
        ? getClosestEnabledHandleIndex(
            values,
            requested,
            min.value,
            max.value,
            push.value,
            isHandleDisabled,
          )
        : 0;
      if (index < 0) return;
      const next = [...values];
      let target = index;
      const distance = values.length
        ? Math.abs(requested - (values[index] ?? min.value))
        : max.value - min.value;
      if (
        editable.value &&
        distance !== 0 &&
        (maxCount.value === undefined || values.length < maxCount.value)
      ) {
        target = values.findIndex((value) => value > requested);
        if (target < 0) target = values.length;
        next.splice(target, 0, requested);
      } else next[index] = requested;
      if (rangeEnabled.value && !values.length && props.count === undefined && !editable.value)
        next.push(requested);
      if (event) {
        onStartMove(event, target, next);
        triggerChange(next);
        void nextTick(() => handlesRef.value?.focus(target));
      } else {
        cancelDrag();
        triggerChange(next);
        finishChange(false);
      }
    };
    const onRootStart = (event: MouseEvent | TouchEvent) => {
      if (
        disabled.value ||
        event.defaultPrevented ||
        (!('targetTouches' in event) && event.button !== 0)
      )
        return;
      const rect = containerRef.value?.getBoundingClientRect();
      if (!rect) return;
      const point = 'targetTouches' in event ? event.targetTouches[0] : event;
      if (!point) return;
      const direction = sliderDirection.value;
      const size = vertical.value ? rect.height : rect.width;
      if (size <= 0) return;
      const distance =
        direction === 'btt'
          ? rect.bottom - point.clientY
          : direction === 'ttb'
            ? point.clientY - rect.top
            : direction === 'rtl'
              ? rect.right - point.clientX
              : point.clientX - rect.left;
      cancelDrag();
      changeToCloseValue(
        formatValue(min.value + (distance / size) * (max.value - min.value)),
        event,
      );
      event.preventDefault();
    };
    const onOffsetChange = (offset: number | 'min' | 'max', index: number) => {
      if (disabled.value || isHandleDisabled(index)) return;
      if (session !== 'keyboard') {
        cancelDrag();
        session = 'keyboard';
      }
      const next = offsetValues(rawValues.value, offset, index);
      triggerChange(next.values);
      void nextTick(() => {
        const matching =
          rawValues.value[index] === next.value ? index : rawValues.value.indexOf(next.value);
        handlesRef.value?.focus(matching < 0 ? index : matching);
      });
    };
    const onDelete = (index: number) => {
      if (disabled.value || !editable.value || rawValues.value.length <= minCount.value) return;
      const next = [...rawValues.value];
      next.splice(index, 1);
      cancelDrag();
      triggerChange(next);
      finishChange(false);
      handlesRef.value?.hideHelp();
      void nextTick(() => handlesRef.value?.focus(Math.max(0, index - 1)));
    };
    const nativeTabIndex = () =>
      typeof attrs.tabindex === 'number'
        ? attrs.tabindex
        : typeof attrs.tabindex === 'string'
          ? Number(attrs.tabindex)
          : 0;
    const handleAttrs = () =>
      Object.fromEntries(Object.entries(attrs).filter(([name]) => name.startsWith('aria-')));
    provide(sliderContextKey, {
      get min() {
        return min.value;
      },
      get max() {
        return max.value;
      },
      get direction() {
        return sliderDirection.value;
      },
      get disabled() {
        return disabled.value;
      },
      get keyboard() {
        return props.keyboard ?? true;
      },
      get step() {
        return step.value;
      },
      get included() {
        return props.included ?? true;
      },
      get includedStart() {
        return rangeEnabled.value ? (sortedValues.value[0] ?? min.value) : min.value;
      },
      get includedEnd() {
        return sortedValues.value[sortedValues.value.length - 1] ?? min.value;
      },
      get range() {
        return rangeEnabled.value;
      },
      get tabIndex() {
        return props.tabIndex ?? nativeTabIndex();
      },
      get ariaLabelForHandle() {
        return props.ariaLabelForHandle;
      },
      get ariaLabelledByForHandle() {
        return props.ariaLabelledByForHandle;
      },
      get ariaRequired() {
        return props.ariaRequired;
      },
      get ariaValueTextFormatterForHandle() {
        return props.ariaValueTextFormatterForHandle;
      },
      get styles() {
        return semantic.styles.value;
      },
      get classNames() {
        return semantic.classNames.value;
      },
      get handleAttrs() {
        return handleAttrs();
      },
      isHandleDisabled,
      onKeydown: (event, index) => {
        emit('keydown', event, index);
        if (
          session === 'keyboard' &&
          (event.defaultPrevented || event.isComposing || event.keyCode === 229)
        )
          resetSession();
      },
      onKeyup: (event, index) => {
        emit('keyup', event, index);
        if (event.defaultPrevented || event.isComposing) resetSession();
      },
    } satisfies SliderContextValue);
    const focus = (): void => {
      const index = rawValues.value.findIndex((_, index) => !isHandleDisabled(index));
      if (index >= 0) handlesRef.value?.focus(index);
    };
    const blur = (): void => {
      const root = containerRef.value;
      const active = root?.ownerDocument.activeElement;
      if (active instanceof HTMLElement && root?.contains(active)) active.blur();
    };
    onMounted(() => {
      if (props.autoFocus) focus();
    });
    const tooltip = computed(() => props.tooltip ?? {});
    const formatter = computed(() =>
      tooltip.value.formatter !== undefined
        ? tooltip.value.formatter
        : props.formatter !== undefined
          ? props.formatter
          : defaultFormatter,
    );
    const useActive = computed(() => rangeEnabled.value && tooltip.value.open !== true);
    const tooltipPlacement = computed(
      () => tooltip.value.placement ?? (vertical.value ? (isRTL.value ? 'left' : 'right') : 'top'),
    );
    const wrapTooltip = (info: SliderHandleInfo & { node: VNodeChild }, active: boolean) =>
      h(
        SliderTooltip,
        {
          key: info.index,
          prefixCls: prefixCls.value,
          tooltipProps: tooltip.value,
          open:
            (active || !useActive.value) &&
            (tooltip.value.open === true ||
              ((hoverOpen.value || focusOpen.value) && tooltip.value.open !== false)) &&
            formatter.value !== null,
          title: formatter.value?.(info.value),
          placement: tooltipPlacement.value,
          getPopupContainer: tooltip.value.getPopupContainer ?? tooltip.value.getTooltipContainer,
        },
        { default: () => info.node },
      );
    const renderSlider = () => {
      const p = prefixCls.value;
      const rootAttrs = Object.fromEntries(
        Object.entries(attrs).filter(
          ([name]) =>
            !name.startsWith('aria-') &&
            name !== 'tabindex' &&
            name !== 'class' &&
            name !== 'style',
        ),
      );
      return h(
        'div',
        mergeProps(rootAttrs, {
          ref: containerRef,
          id: props.id,
          class: [
            p,
            attrs.class,
            context.className,
            semantic.classNames.value.root,
            {
              [`${p}-rtl`]: isRTL.value,
              [`${p}-lock`]: dragging.value,
              [`${p}-disabled`]: disabled.value,
              [`${p}-vertical`]: vertical.value,
              [`${p}-horizontal`]: !vertical.value,
              [`${p}-with-marks`]: markList.value.length > 0,
            },
          ],
          style: [themeStyle.value, semantic.styles.value.root, attrs.style],
          onMousedown: onRootStart,
          onTouchstart: onRootStart,
        }),
        [
          h('div', {
            class: [`${p}-rail`, semantic.classNames.value.rail],
            style: [props.railStyle, semantic.styles.value.rail],
          }),
          props.track === false
            ? null
            : h(Tracks, {
                prefixCls: p,
                style: props.trackStyle,
                values: rawValues.value,
                startPoint: props.startPoint,
                onStartMove: draggableTrack.value ? onStartMove : undefined,
              }),
          h(Steps, {
            prefixCls: p,
            marks: markList.value,
            dots: props.dots ?? false,
            style: props.dotStyle,
            activeStyle: props.activeDotStyle,
          }),
          h(
            Handles,
            {
              ref: handlesRef,
              prefixCls: p,
              style: props.handleStyle,
              values: renderValues.value,
              dragging: dragging.value,
              draggingIndex: draggingIndex.value,
              draggingDelete: draggingDelete.value,
              hasActiveHandle:
                useActive.value &&
                tooltip.value.open !== false &&
                formatter.value !== null &&
                (hoverOpen.value || focusOpen.value || dragging.value),
              onStartMove,
              onOffsetChange,
              onChangeComplete: () => {
                if (session === 'keyboard') finishChange(false);
              },
              onDelete,
              onFocus: (event, index) => {
                focusOpen.value = true;
                emit('focus', event, index);
              },
              onBlur: (event, index) => {
                focusOpen.value = false;
                emit('blur', event, index);
                const root = containerRef.value;
                if (
                  session === 'keyboard' &&
                  (!(event.relatedTarget instanceof Node) || !root?.contains(event.relatedTarget))
                )
                  finishChange(false);
              },
              onMouseenter: () => {
                hoverOpen.value = true;
              },
              onMouseleave: () => {
                hoverOpen.value = false;
              },
            },
            {
              handle: slots.handle,
              activeHandle: slots.activeHandle,
              wrapper: (info: SliderHandleInfo & { node: VNodeChild }) => wrapTooltip(info, false),
              activeWrapper: (info: SliderHandleInfo & { node: VNodeChild }) =>
                wrapTooltip(info, true),
            },
          ),
          h(Marks, {
            prefixCls: p,
            marks: markList.value,
            onClick: (value: number) => changeToCloseValue(value),
          }),
        ],
      );
    };
    return { focus, blur, renderSlider };
  },
  render() {
    return this.renderSlider();
  },
});
</script>
