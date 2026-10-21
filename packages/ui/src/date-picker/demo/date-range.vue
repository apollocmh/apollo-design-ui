<script setup lang="ts">
// 对齐 antd 的 demo/date-range.tsx：RangePicker 的多种面板粒度与取值回显。
import type { DatePickerMode, NoUndefinedRangeValue } from '@apollo-design/ui';
import { DatePicker, Flex, Radio, RadioGroup } from '@apollo-design/ui';
import { ref } from 'vue';

const picker = ref<DatePickerMode>('date');
const valueText = ref('（未选择）');

const onChange = (_dates: NoUndefinedRangeValue | null, dateStrings: [string, string]) => {
  valueText.value = dateStrings[0] || dateStrings[1] ? dateStrings.join(' → ') : '（已清空）';
};
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <RadioGroup v-model:value="picker" aria-label="范围选择粒度">
      <Radio value="date">日期</Radio>
      <Radio value="week">周</Radio>
      <Radio value="month">月</Radio>
      <Radio value="year">年</Radio>
    </RadioGroup>
    <DatePicker.RangePicker
      :picker="picker"
      :placeholder="['开始日期', '结束日期']"
      @change="onChange"
    />
    <div class="demo-picker-hint">当前值：{{ valueText }}</div>
  </Flex>
</template>

<style scoped>
.demo-picker-hint {
  color: rgb(0 0 0 / 45%);
  font-size: 12px;
}
</style>
