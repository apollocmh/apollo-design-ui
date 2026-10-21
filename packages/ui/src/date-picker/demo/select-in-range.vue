<script setup lang="ts">
// 对齐 antd 的 demo/select-in-range.tsx：
// calendarChange 记录起点，disabledDate 把可选范围限制在 7 天内。
import type { DisabledDate, RangePickerEmits } from '@apollo-design/ui';
import { DatePicker, Flex } from '@apollo-design/ui';
import dayjs from 'dayjs';
import { ref } from 'vue';

const hint = ref('先选择开始日期，再在 7 天内选择结束日期。');

const disabledDate: DisabledDate = (current, info) => {
  if (current.isBefore(dayjs().startOf('day'))) return true;
  if (!info.from) return false;
  return Math.abs(current.diff(info.from, 'day')) > 7;
};

const onCalendarChange: RangePickerEmits['calendarChange'] = (dates, _dateStrings, info) => {
  if (info.range === 'start' && dates[0]) {
    hint.value = `开始日期：${dates[0].format('YYYY-MM-DD')}，结束日期需在 7 天内。`;
  } else if (info.range === 'end' && dates[1]) {
    hint.value = `已选择：${dates[0]?.format('YYYY-MM-DD') ?? '?'} → ${dates[1].format(
      'YYYY-MM-DD',
    )}`;
  }
};
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <DatePicker.RangePicker
      :disabled-date="disabledDate"
      :placeholder="['开始日期', '结束日期']"
      @calendar-change="onCalendarChange"
    />
    <div class="demo-picker-hint">{{ hint }}</div>
  </Flex>
</template>

<style scoped>
.demo-picker-hint {
  color: rgb(0 0 0 / 45%);
  font-size: 12px;
}
</style>
