<script setup lang="ts">
import dayjs from 'dayjs';
import { ref } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import type {
  TimePickerExpose,
  TimePickerValue,
  TimeRangePickerExpose,
  TimeRangeValue,
} from '../../interface';
import TimePicker from '../../TimePicker.vue';
import TimeRangePicker from '../../TimeRangePicker.vue';

const value = ref<TimePickerValue>(dayjs('2026-10-20 10:15:20'));
const range = ref<TimeRangeValue | null>([
  dayjs('2026-10-20 10:15:20'),
  dayjs('2026-10-20 12:15:20'),
]);
const open = ref(false);
const pickerValue = ref(dayjs('2026-10-20 10:15:20'));
const singleRef = ref<TimePickerExpose | null>(null);
const rangeRef = ref<TimeRangePickerExpose | null>(null);
</script>

<template>
  <ConfigProvider :components="{ timePicker: { variant: 'filled', classNames: { root: 'native-time' }, separator: 'until' } }">
    <TimePicker ref="singleRef" v-model:value="value" v-model:open="open" v-model:pickerValue="pickerValue" input-read-only>
      <template #cellRender="{ current, info }"><span :data-subtype="info.subType">{{ current }}</span></template>
      <template #extraFooter="{ mode }"><span>{{ mode }}</span></template>
    </TimePicker>
    <TimeRangePicker ref="rangeRef" v-model:value="range" input-read-only>
      <template #separator>until</template>
    </TimeRangePicker>
    <output :data-single="Boolean(singleRef?.nativeElement)" :data-range="Boolean(rangeRef?.startInput)" />
  </ConfigProvider>
</template>
