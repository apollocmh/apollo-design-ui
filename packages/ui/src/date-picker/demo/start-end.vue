<script setup lang="ts">
// 对齐 antd 的 demo/start-end.tsx：两个 DatePicker 互相限制可选范围。
import type { DatePickerDate, DisabledDate, SingleValue } from '@apollo-design/ui';
import { DatePicker, Flex } from '@apollo-design/ui';
import { ref } from 'vue';

const start = ref<DatePickerDate | null>(null);
const end = ref<DatePickerDate | null>(null);

const disabledStart: DisabledDate = (current) =>
  end.value ? current.isAfter(end.value, 'day') : false;

const disabledEnd: DisabledDate = (current) =>
  start.value ? current.isBefore(start.value, 'day') : false;

const onStartChange = (value: SingleValue) => {
  start.value = Array.isArray(value) ? null : value;
};

const onEndChange = (value: SingleValue) => {
  end.value = Array.isArray(value) ? null : value;
};
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <Flex gap="small" align="center">
      <DatePicker
        :value="start"
        :disabled-date="disabledStart"
        placeholder="开始日期"
        aria-label="开始日期"
        @change="onStartChange"
      />
      <span>至</span>
      <DatePicker
        :value="end"
        :disabled-date="disabledEnd"
        placeholder="结束日期"
        aria-label="结束日期"
        @change="onEndChange"
      />
    </Flex>
    <div class="demo-picker-hint">
      当前范围：{{ start?.format('YYYY-MM-DD') ?? '（空）' }} → {{ end?.format('YYYY-MM-DD') ?? '（空）' }}
    </div>
  </Flex>
</template>

<style scoped>
.demo-picker-hint {
  color: rgb(0 0 0 / 45%);
  font-size: 12px;
}
</style>
