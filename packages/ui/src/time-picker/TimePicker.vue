<script setup lang="ts">
/**
 * Fixed time-axis shell over the shared native picker. Notifications are owned
 * emits; current attrs and slot presence are forwarded during render. Boolean
 * defaults stay undefined so the shared time configuration can infer its columns.
 * The wrapper forwards the actual nullable DOM handle and native focus/blur.
 */

import { useLocale } from '@apollo-design/locale';
import { computed, provide, ref, useAttrs } from 'vue';
import { pickerHostContextKey } from '../_internal/picker-host-context';
import DatePicker from '../date-picker/DatePicker.vue';
import { useMergedPickerSemantic } from '../date-picker/hooks/use-picker-semantic';
import type {
  DatePickerDate,
  DatePickerPanelMode,
  OpenConfig,
  SingleValue,
} from '../date-picker/interface';
import { useVariant } from '../form/hooks/useVariants';
import type { TimePickerProps, TimePickerSlots } from './interface';

const InnerPicker = DatePicker;

defineOptions({ name: 'ATimePicker', inheritAttrs: false });

const props = withDefaults(defineProps<TimePickerProps>(), {
  open: undefined,
  defaultOpen: undefined,
  multiple: undefined,
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
  previewValue: undefined,
});
const attrs = useAttrs();
const [timeLocale] = useLocale('TimePicker');
const slots = defineSlots<TimePickerSlots>();
const emit = defineEmits<{
  change: [date: SingleValue, dateString: string | string[] | null];
  'update:value': [date: SingleValue];
  calendarChange: [
    date: SingleValue,
    dateString: string | string[],
    info: { range?: 'start' | 'end'; from?: DatePickerDate },
  ];
  ok: [date: DatePickerDate | DatePickerDate[]];
  openChange: [open: boolean, config?: OpenConfig];
  'update:open': [open: boolean];
  pickerValueChange: [
    date: DatePickerDate,
    info: { source: 'reset' | 'panel'; mode: DatePickerPanelMode },
  ];
  'update:pickerValue': [date: DatePickerDate];
  panelChange: [value: DatePickerDate, mode: DatePickerPanelMode];
  clear: [];
  focus: [event: FocusEvent, info: { range?: 'start' | 'end' }];
  blur: [event: FocusEvent, info: { range?: 'start' | 'end' }];
  invalid: [invalid: boolean];
  select: [date: DatePickerDate];
  keydown: [event: KeyboardEvent];
}>();
provide(pickerHostContextKey, { configKey: 'timePicker', warningName: 'TimePicker' });
const { variant: mergedVariant } = useVariant({
  component: 'timePicker',
  variant: () => props.variant,
  legacyBordered: () => props.bordered,
});

const semanticProps = new Proxy(props, {
  get: (target, key, receiver) =>
    key === 'variant' ? mergedVariant.value : Reflect.get(target, key, receiver),
});

const { classNames: mergedClassNames, styles: mergedStyles } = useMergedPickerSemantic({
  classNames: () => props.classNames,
  styles: () => props.styles,
  popupClassName: () => props.popupClassName,
  popupStyle: () => (props.popupStyle ? { ...props.popupStyle } : undefined),
  props: semanticProps,
});
const forwardProps = (): InstanceType<typeof DatePicker>['$props'] => {
  const {
    variant: _variant,
    bordered: _bordered,
    classNames: _classNames,
    styles: _styles,
    popupClassName: _popupClassName,
    popupStyle: _popupStyle,
    defaultValue,
    ...rest
  } = props;
  return {
    ...rest,
    ...attrs,
    defaultValue: defaultValue ?? undefined,
    placeholder:
      props.placeholder ??
      props.locale?.timePickerLocale.placeholder ??
      timeLocale.value.placeholder,
    picker: 'time',
    mode: 'time',
    multiple: false,
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
    onSelect: (date) => emit('select', date),
  };
};
const innerRef = ref<{
  nativeElement: HTMLElement | null;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
} | null>(null);

defineExpose({
  get nativeElement(): HTMLElement | null {
    return innerRef.value?.nativeElement ?? null;
  },
  focus: (options?: FocusOptions): void => innerRef.value?.focus(options),
  blur: (): void => innerRef.value?.blur(),
});
</script>

<template>
  <InnerPicker ref="innerRef" v-bind="forwardProps()" :variant="mergedVariant" :class-names="mergedClassNames" :styles="mergedStyles">
    <template v-if="slots.panelRender" #panelRender="scope"><slot name="panelRender" v-bind="scope" /></template>
    <template v-if="slots.extraFooter" #extraFooter="scope"><slot name="extraFooter" v-bind="scope" /></template>
    <template v-if="slots.cellRender" #cellRender="scope"><slot name="cellRender" v-bind="scope" /></template>
    <template v-if="slots.prefix" #prefix><slot name="prefix" /></template>
    <template v-if="slots.suffixIcon" #suffixIcon><slot name="suffixIcon" /></template>
    <template v-if="slots.clearIcon" #clearIcon><slot name="clearIcon" /></template>
    <template v-if="slots.presetRender" #presetRender="scope"><slot name="presetRender" v-bind="scope" /></template>
  </InnerPicker>
</template>
