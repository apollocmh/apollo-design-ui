<script setup lang="ts">
// 对齐 antd 的 demo/switchable.tsx：通过 picker 切换日期 / 周 / 月 / 季 / 年粒度。
import type { DatePickerMode, SingleValue } from '@apollo-design/ui';
import { DatePicker, Flex, Radio, RadioGroup } from '@apollo-design/ui';
import { ref } from 'vue';

const picker = ref<DatePickerMode>('date');
const valueText = ref('（未选择）');

const onChange = (_date: SingleValue, dateString: string | string[] | null) => {
  valueText.value = typeof dateString === 'string' && dateString ? dateString : '（已清空）';
};
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <RadioGroup v-model:value="picker" aria-label="选择粒度">
      <Radio value="date">日期</Radio>
      <Radio value="week">周</Radio>
      <Radio value="month">月</Radio>
      <Radio value="quarter">季度</Radio>
      <Radio value="year">年</Radio>
    </RadioGroup>
    <DatePicker
      :picker="picker"
      :placeholder="`当前粒度：${picker}`"
      aria-label="可切换粒度的日期选择器"
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
