<script setup lang="ts">
// 对齐 antd 的 demo/disabled-date.tsx
import { DatePicker, type DisabledDate, Flex } from '@apollo-design/ui';

/** 禁用周末：disabledDate 返回 true 的日期不可选。 */
const disabledDate: DisabledDate = (current) => current.day() === 0 || current.day() === 6;
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <DatePicker :disabled-date="disabledDate" placeholder="只能选工作日" />
    <DatePicker.RangePicker :disabled-date="disabledDate" />
  </Flex>
</template>
