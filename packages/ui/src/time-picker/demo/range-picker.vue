<script setup lang="ts">
// 对齐 antd 的 range-picker demo。
//
// ⚠️ 上游写的是 `TimePicker.RangePicker`（静态成员）；本仓两种写法都支持，
//    这里用具名导出 `TimeRangePicker`（类型可见性更好）。
import { TimeRangePicker } from '@apollo-design/ui';
import dayjs from 'dayjs';

const format = 'HH:mm:ss';
const startTime = dayjs('12:08:23', format);
const endTime = dayjs('12:08:23', format);
</script>

<template>
  <TimeRangePicker :default-value="[startTime, endTime]" :format="format" />
</template>
