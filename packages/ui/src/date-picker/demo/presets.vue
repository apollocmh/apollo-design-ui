<script setup lang="ts">
// 对齐 antd 的 demo/presets.tsx
import { DatePicker, type RangeValueDate, type ValueDate } from '@apollo-design/ui';
import dayjs from 'dayjs';

const presets: ValueDate[] = [
  { label: '今天', value: dayjs() },
  { label: '昨天', value: dayjs().subtract(1, 'day') },
  { label: '一周前', value: dayjs().subtract(1, 'week') },
];

const rangePresets: RangeValueDate[] = [
  { label: '最近一周', value: [dayjs().subtract(1, 'week'), dayjs()] },
  { label: '最近一个月', value: [dayjs().subtract(1, 'month'), dayjs()] },
  { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-start">
    <DatePicker :presets="presets" placeholder="单值预设" />
    <DatePicker.RangePicker :presets="rangePresets" />
  </div>
</template>
