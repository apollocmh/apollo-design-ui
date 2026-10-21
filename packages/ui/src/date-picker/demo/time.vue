<script setup lang="ts">
// 对齐 antd 的 demo/time.tsx：showTime + disabledTime 限制可选时段。
import type { DatePickerProps, SingleValue } from '@apollo-design/ui';
import { DatePicker, Flex } from '@apollo-design/ui';
import { ref } from 'vue';

const valueText = ref('（未选择）');

const disabledTime: NonNullable<DatePickerProps['disabledTime']> = () => ({
  disabledHours: () =>
    Array.from({ length: 24 }, (_, hour) => hour).filter((hour) => hour < 9 || hour > 18),
});

const onChange = (_date: SingleValue, dateString: string | string[] | null) => {
  valueText.value = typeof dateString === 'string' && dateString ? dateString : '（已清空）';
};
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <DatePicker
      show-time
      format="YYYY-MM-DD HH:mm"
      :disabled-time="disabledTime"
      placeholder="仅可选 09:00 - 18:00"
      aria-label="仅可选工作时间的日期时间选择器"
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
