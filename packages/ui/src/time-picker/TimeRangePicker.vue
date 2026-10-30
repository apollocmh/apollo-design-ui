<script setup lang="ts">
/**
 * TimeRangePicker —— antd `time-picker/index.tsx` 的 `RangePicker`（**只有 3 行**）的 Vue 版。
 *
 * ```jsx
 * const RangePicker = forwardRef((props, ref) => (
 *   <InternalRangePicker {...props} picker="time" mode={undefined} ref={ref} />
 * ));
 * ```
 *
 * ── 🚨 它与单个 `TimePicker` 的**三处**关键差别（都实测过，见分析 §2.2 / §2.4）────
 *
 * 1. **外层不解构任何 prop** ⇒ `bordered` / `popupClassName` / `popupStyle` /
 *    `onSelect` **全部原样透传**给内层，由内层（命名空间 `DatePicker.RangePicker`）
 *    发废弃告警。
 *    ⚠️ 这与单个 `TimePicker` **正好相反**（那边必须吞掉那三个）—— 是本组件最容易
 *    「顺手照抄单个的写法」而写错的一处，L1 有断言钉住。
 * 2. **没有 `variant` 合并** —— 内层 `RangePicker.vue` 用
 *    `useVariant({ component: 'rangePicker' })`，读的是 `components.rangePicker`。
 * 3. **`separator` 读 `rangePicker.separator`**（内层自己处理），与 `timePicker` 无关。
 *
 * ── 仍然要改道的两件事 ────────────────────────────────────────────────────────
 *
 * - **配置键**：内层 `RangePicker.vue` 的 `pickerType = picker === TIME ? 'timePicker' : 'datePicker'`
 *   ⇒ 传了 `picker="time"` 之后它读 `timePicker` 那份语义配置。本仓内层是硬编码的
 *   ⇒ 用 `pickerHostContextKey` 把配置键改成 `timePicker`。
 * - **`picker="time"`**：上游写在 `{...props}` **之后**（用户传的 `picker` 会被覆盖）；
 *   `TimeRangePickerProps` 本来就 `Omit<'picker'>`，所以本仓靠「不声明该 prop」
 *   让它落进 `attrs`，再由显式的 `picker: 'time'`（放在 `...attrs` **之后**）覆盖。
 * - **`mode` 丢弃**：上游 `mode={undefined}`；本仓 `RangePicker.vue` 的 `mode`
 *   不在 `withDefaults` 里 ⇒ 不转发就等于 `undefined`。
 *
 * ⚠️ **不覆盖 `warningName`** —— 实测 `TimePicker.RangePicker` 的废弃告警前缀仍是
 * `[antd: DatePicker.RangePicker]`（不是 `[antd: TimePicker]`）。
 */

import { provide, ref, useAttrs } from 'vue';
import { pickerHostContextKey } from '../_internal/picker-host-context';
import type {
  DatePickerDate,
  DatePickerPanelMode,
  NoUndefinedRangeValue,
  OpenConfig,
  RangeValue,
} from '../date-picker/interface';
import RangePicker from '../date-picker/RangePicker.vue';
import type { TimeRangePickerProps, TimeRangePickerSlots } from './interface';

const InnerPicker = RangePicker;

defineOptions({ name: 'ATimeRangePicker', inheritAttrs: false });

/**
 * 🚨 与 `TimePicker.vue` 同一判据（PLAN.md 避坑清单第 5 条）：Boolean prop 未传时
 * Vue 会强制成 `false` ⇒ `bordered` 变 `false` ⇒ 默认渲染成 `-borderless`。
 * 清单与 `RangePicker.vue` 逐项对齐（去掉本组件没有的 `showTime`）。
 */
const props = withDefaults(defineProps<TimeRangePickerProps>(), {
  open: undefined,
  defaultOpen: undefined,
  showWeek: undefined,
  showNow: undefined,
  showToday: undefined,
  inputReadOnly: undefined,
  preserveInvalidOnBlur: undefined,
  needConfirm: undefined,
  order: undefined,
  disabled: undefined,
  bordered: undefined,
  required: undefined,
  autoFocus: undefined,
  prefix: undefined,
  suffixIcon: undefined,
  clearIcon: undefined,
  separator: undefined,
  prevIcon: undefined,
  nextIcon: undefined,
  superPrevIcon: undefined,
  superNextIcon: undefined,
  removeIcon: undefined,
  pickerValue: undefined,
  defaultPickerValue: undefined,
  defaultOpenValue: undefined,
  // 🚨 新补的顶层时间键里 4 个是 Boolean ⇒ 未传时 Vue 会强制成 `false`
  //    （PLAN.md 避坑清单第 5 条）。薄壳会把 `props` 整包转发给内层 ⇒ 不在这里
  //    显式给 `undefined`，就会把 `showHour: false` **显式**喂给内层，
  //    内层自己的 `withDefaults` 也救不回来（值不是 `undefined`）。
  use12Hours: undefined,
  showHour: undefined,
  showMinute: undefined,
  showSecond: undefined,
  showMillisecond: undefined,
  hideDisabledOptions: undefined,
  changeOnScroll: undefined,
  allowClear: undefined,
  allowEmpty: undefined,
  previewValue: undefined,
  presets: undefined,
  ranges: undefined,
});
const attrs = useAttrs();
const slots = defineSlots<TimeRangePickerSlots>();
const emit = defineEmits<{
  change: [dates: NoUndefinedRangeValue | null, dateStrings: [string, string]];
  'update:value': [dates: RangeValue | null];
  calendarChange: [
    dates: NoUndefinedRangeValue,
    dateStrings: [string, string],
    info: { range?: 'start' | 'end'; from?: DatePickerDate },
  ];
  ok: [dates: NoUndefinedRangeValue];
  openChange: [open: boolean, config?: OpenConfig];
  'update:open': [open: boolean];
  'update:mode': [mode: [DatePickerPanelMode, DatePickerPanelMode]];
  pickerValueChange: [
    date: [DatePickerDate, DatePickerDate],
    info: { source: 'reset' | 'panel'; mode: [DatePickerPanelMode, DatePickerPanelMode] },
  ];
  'update:pickerValue': [date: [DatePickerDate, DatePickerDate]];
  panelChange: [values: NoUndefinedRangeValue, modes: [DatePickerPanelMode, DatePickerPanelMode]];
  clear: [];
  focus: [event: FocusEvent, info: { range?: 'start' | 'end' }];
  blur: [event: FocusEvent, info: { range?: 'start' | 'end' }];
  invalid: [invalid: boolean];
  keydown: [event: KeyboardEvent];
}>();

// ============================== 宿主上下文改道 ==============================
/** ⚠️ **只改 `configKey`** —— 告警命名空间恒为内层的 `'DatePicker.RangePicker'`（实测）。 */
provide(pickerHostContextKey, { configKey: 'timePicker' });

// ============================== 转发给内层 ==============================
/**
 * 上游的 `{...props} picker="time" mode={undefined}`。
 *
 * - `mode` 解构掉（= `undefined`，见文件头）；
 * - `picker: 'time'` 写在**最后** ⇒ 压过 `attrs` 里用户可能传的 `picker`；
 * - `attrs` 在 `picker` **之前** ⇒ 事件监听（`onChange` / `onOk` / …）与
 *   `class` / `style` 原样进去，而 `picker` 不被用户覆盖。
 */
const forwardProps = (): InstanceType<typeof RangePicker>['$props'] => {
  const { mode: _mode, ...rest } = props;
  return {
    ...rest,
    // ⚠️ `attrs` 必须转发（本组件不声明 `defineEmits`，见文件头）——
    //    用户传的 `onChange` / `onOk` / … 全在这里；`picker` 写在**最后**压过它。
    ...attrs,
    picker: 'time' as const,
    onChange: (date, text) => emit('change', date, text),
    'onUpdate:value': (date) => emit('update:value', date),
    onCalendarChange: (date, text, info) => emit('calendarChange', date, text, info),
    onOk: (date) => emit('ok', date),
    onOpenChange: (open, config) => emit('openChange', open, config),
    'onUpdate:open': (open) => emit('update:open', open),
    onPickerValueChange: (date, info) => emit('pickerValueChange', date, info),
    'onUpdate:pickerValue': (date) => emit('update:pickerValue', date),
    onPanelChange: (date, mode) => emit('panelChange', date, mode),
    'onUpdate:mode': (mode) => emit('update:mode', mode),
    onClear: () => emit('clear'),
    onFocus: (event, info) => emit('focus', event, info),
    onBlur: (event, info) => emit('blur', event, info),
    onInvalid: (invalid) => emit('invalid', invalid),
    onKeydown: (event) => emit('keydown', event),
  };
};

/** 插槽转发（与单个 `TimePicker` 同一份清单，见那边的说明）。 */
// ============================== 命令面转发（Issue #6.1）==============================
/** 上游 `forwardRef((props, ref) => <InternalRangePicker {...props} ref={ref} />)`。 */
const innerRef = ref<{
  nativeElement: HTMLElement | null;
  focus: (index?: number | (FocusOptions & { index?: number })) => void;
  blur: () => void;
  startInput: HTMLInputElement | null;
  endInput: HTMLInputElement | null;
} | null>(null);

defineExpose({
  get nativeElement(): HTMLElement | null {
    return innerRef.value?.nativeElement ?? null;
  },
  focus: (index?: number | (FocusOptions & { index?: number })): void =>
    innerRef.value?.focus(index),
  blur: (): void => innerRef.value?.blur(),
  get startInput(): HTMLInputElement | null {
    return innerRef.value?.startInput ?? null;
  },
  get endInput(): HTMLInputElement | null {
    return innerRef.value?.endInput ?? null;
  },
});
</script>

<template>
  <InnerPicker ref="innerRef" v-bind="forwardProps()">
    <template v-if="slots.panelRender" #panelRender="scope"><slot name="panelRender" v-bind="scope" /></template>
    <template v-if="slots.extraFooter" #extraFooter="scope"><slot name="extraFooter" v-bind="scope" /></template>
    <template v-if="slots.cellRender" #cellRender="scope"><slot name="cellRender" v-bind="scope" /></template>
    <template v-if="slots.tagRender" #tagRender="scope"><slot name="tagRender" v-bind="scope" /></template>
    <template v-if="slots.prefix" #prefix><slot name="prefix" /></template>
    <template v-if="slots.suffixIcon" #suffixIcon><slot name="suffixIcon" /></template>
    <template v-if="slots.clearIcon" #clearIcon><slot name="clearIcon" /></template>
    <template v-if="slots.separator" #separator><slot name="separator" /></template>
    <template v-if="slots.presetRender" #presetRender="scope"><slot name="presetRender" v-bind="scope" /></template>
  </InnerPicker>
</template>
