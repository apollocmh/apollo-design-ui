<script setup lang="ts">
// 对齐 antd 的 demo/disabled.tsx：整框禁用、范围单端禁用与带默认值禁用。
import { DatePicker, Flex } from '@apollo-design/ui';
import dayjs from 'dayjs';
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <DatePicker disabled placeholder="完全禁用" aria-label="完全禁用的日期选择器" />
    <DatePicker
      disabled
      :default-value="dayjs('2026-10-21')"
      placeholder="禁用且带默认值"
      aria-label="禁用且带默认值的日期选择器"
    />
    <DatePicker.RangePicker
      :disabled="[true, false]"
      :placeholder="['开始日期（禁用）', '结束日期（可选）']"
    />
    <DatePicker.RangePicker disabled :placeholder="['开始日期', '结束日期']" />
    <div class="demo-picker-hint">范围选择器的 `disabled` 支持 `[boolean, boolean]` 单端禁用。</div>
  </Flex>
</template>

<style scoped>
.demo-picker-hint {
  color: rgb(0 0 0 / 45%);
  font-size: 12px;
}
</style>
