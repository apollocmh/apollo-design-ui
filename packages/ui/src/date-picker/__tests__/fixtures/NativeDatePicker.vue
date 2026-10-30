<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, ref } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import TimePicker from '../../../time-picker/TimePicker.vue';
import DatePicker from '../../DatePicker.vue';
import type {
  DatePickerDate,
  DatePickerExpose,
  DatePickerPanelMode,
  RangeValue,
  SingleValue,
} from '../../interface';
import RangePicker from '../../RangePicker.vue';

const shown = ref(true);
const slotsShown = ref(true);
const tokenHeight = ref(31);
const theme = computed(() => ({
  components: {
    DatePicker: {
      cellHeight: tokenHeight.value,
      zIndexPopup: 1810,
      cellHoverWithRangeBg: 'rgb(10, 20, 30)',
      cellRangeBorderColor: 'rgb(70, 80, 90)',
    },
  },
}));
const date = ref<SingleValue>(dayjs('2026-10-20'));
const range = ref<RangeValue | null>([dayjs('2026-10-20'), dayjs('2026-10-24')]);
const time = ref<DatePickerDate | null>(dayjs('2026-10-20 10:15:20'));
const pickerValue = ref(dayjs('2026-10-20'));
const mode = ref<DatePickerPanelMode>('date');
const dateRef = ref<DatePickerExpose | null>(null);
const dateText = computed(() =>
  dayjs.isDayjs(date.value) ? date.value.format('YYYY-MM-DD') : 'empty',
);
const rangeText = computed(
  () => range.value?.map((value) => value?.format('YYYY-MM-DD') ?? '').join('/') ?? 'empty',
);
const timeText = computed(() =>
  dayjs.isDayjs(time.value) ? time.value.format('HH:mm:ss') : 'empty',
);
</script>

<template>
  <ConfigProvider :theme="theme">
    <button id="slot-toggle" @click="slotsShown = !slotsShown">slots</button>
    <button id="theme-change" @click="tokenHeight = 39">theme</button>
    <button id="unmount" @click="shown = false">unmount</button>
    <template v-if="shown">
      <DatePicker id="date" ref="dateRef" v-model:value="date" v-model:pickerValue="pickerValue" v-model:mode="mode" input-read-only :disabled-date="(value) => value.date() === 21" aria-label="Readonly date">
        <template v-if="slotsShown" #prefix><span class="current-prefix">prefix</span></template>
        <template v-if="slotsShown" #extraFooter><span class="current-footer">footer</span></template>
      </DatePicker>
      <RangePicker id="range" v-model:value="range" input-read-only aria-label="Readonly range" />
      <TimePicker id="time" v-model:value="time" input-read-only :disabled-hours="() => [11]" aria-label="Readonly time" />
      <DatePicker id="draft" format="YYYY-MM-DD" aria-label="Draft date" />
      <DatePicker id="mask" :format="{ format: 'YYYY-MM-DD', type: 'mask' }" aria-label="Masked date" />
    </template>
    <output id="state" :data-date="dateText" :data-range="rangeText" :data-time="timeText" :data-element="Boolean(dateRef?.nativeElement)" />
  </ConfigProvider>
</template>
