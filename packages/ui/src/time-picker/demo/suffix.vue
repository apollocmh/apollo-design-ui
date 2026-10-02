<script setup lang="ts">
// 对齐 antd 的 suffix demo。
import { SmileOutlined } from '@apollo-design/icons';
import type { TimePickerEmits } from '@apollo-design/ui';
import { Space, TimePicker, TimeRangePicker } from '@apollo-design/ui';

const onChange: TimePickerEmits['change'] = (time, timeString) => {
  console.log(time, timeString);
};
</script>

<template>
  <Space vertical :size="12">
    <TimePicker @change="onChange">
      <template #suffixIcon><SmileOutlined /></template>
    </TimePicker>
    <TimePicker>
      <template #prefix><SmileOutlined /></template>
    </TimePicker>
    <TimeRangePicker>
      <template #prefix><SmileOutlined /></template>
    </TimeRangePicker>
  </Space>
</template>
