<script setup lang="ts">
// 对齐 antd 的 demo/mode.tsx：用受控 `mode` 切换面板粒度，并监听 panelChange。
import type { DatePickerDate, DatePickerPanelMode, SingleValue } from '@apollo-design/ui';
import { DatePicker, Flex, Radio, RadioGroup } from '@apollo-design/ui';
import { ref } from 'vue';

const mode = ref<DatePickerPanelMode>('date');
const panelText = ref('（尚未切换面板）');
const valueText = ref('（未选择）');

const onPanelChange = (value: DatePickerDate, nextMode: DatePickerPanelMode) => {
  panelText.value = `${value.format('YYYY-MM-DD')} → ${nextMode}`;
};

const onChange = (_date: SingleValue, dateString: string | string[] | null) => {
  valueText.value = typeof dateString === 'string' && dateString ? dateString : '（已清空）';
};
</script>

<template>
  <Flex vertical align="flex-start" gap="small">
    <RadioGroup v-model:value="mode" aria-label="面板粒度">
      <Radio value="date">date</Radio>
      <Radio value="month">month</Radio>
      <Radio value="year">year</Radio>
    </RadioGroup>
    <DatePicker
      :mode="mode"
      placeholder="受控面板模式"
      aria-label="受控面板模式"
      @panel-change="onPanelChange"
      @change="onChange"
    />
    <div class="demo-picker-hint">panelChange：{{ panelText }}</div>
    <div class="demo-picker-hint">当前值：{{ valueText }}</div>
  </Flex>
</template>

<style scoped>
.demo-picker-hint {
  color: rgb(0 0 0 / 45%);
  font-size: 12px;
}
</style>
