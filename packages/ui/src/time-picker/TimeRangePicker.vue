<script setup lang="ts">
/**
 * Fixed time-axis shell over the shared native picker. Notifications are owned
 * emits; current attrs and slot presence are forwarded during render. Boolean
 * defaults stay undefined so the shared time configuration can infer its columns.
 * The wrapper forwards the actual nullable DOM handle and native focus/blur.
 */

import { useLocale } from '@apollo-design/locale';
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

const props = withDefaults(defineProps<TimeRangePickerProps>(), {
  open: undefined,
  defaultOpen: undefined,
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
  pickerValue: undefined,
  defaultPickerValue: undefined,
  defaultOpenValue: undefined,
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
const [timeLocale] = useLocale('TimePicker');
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
provide(pickerHostContextKey, { configKey: 'timePicker' });
const forwardProps = (): InstanceType<typeof RangePicker>['$props'] => {
  const rest = props;
  return {
    ...rest,
    ...attrs,
    placeholder:
      props.placeholder ??
      props.locale?.timePickerLocale.rangePlaceholder ??
      timeLocale.value.rangePlaceholder,
    picker: 'time',
    mode: ['time', 'time'],
    onChange: (date, text) => emit('change', date, text),
    'onUpdate:value': (date) => emit('update:value', date),
    onCalendarChange: (date, text, info) => emit('calendarChange', date, text, info),
    onOk: (date) => emit('ok', date),
    onOpenChange: (open, config) => emit('openChange', open, config),
    'onUpdate:open': (open) => emit('update:open', open),
    onPickerValueChange: (date, info) => emit('pickerValueChange', date, info),
    'onUpdate:pickerValue': (date) => emit('update:pickerValue', date),
    onPanelChange: (date, mode) => emit('panelChange', date, mode),
    onClear: () => emit('clear'),
    onFocus: (event, info) => emit('focus', event, info),
    onBlur: (event, info) => emit('blur', event, info),
    onInvalid: (invalid) => emit('invalid', invalid),
    onKeydown: (event) => emit('keydown', event),
  };
};
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
    <template v-if="slots.prefix" #prefix><slot name="prefix" /></template>
    <template v-if="slots.suffixIcon" #suffixIcon><slot name="suffixIcon" /></template>
    <template v-if="slots.clearIcon" #clearIcon><slot name="clearIcon" /></template>
    <template v-if="slots.separator" #separator><slot name="separator" /></template>
    <template v-if="slots.presetRender" #presetRender="scope"><slot name="presetRender" v-bind="scope" /></template>
  </InnerPicker>
</template>
