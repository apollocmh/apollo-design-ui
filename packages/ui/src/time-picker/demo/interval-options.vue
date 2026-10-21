<script setup lang="ts">
// 对齐 antd 的 interval-options demo：自定义时/分/秒步长，滚动即预览、无需确认。
import type { TimePickerEmits } from '@apollo-design/ui';
import { Text, TimePicker } from '@apollo-design/ui';
import { ref } from 'vue';

const selected = ref('（未选择）');

const onChange: TimePickerEmits['change'] = (_time, timeString) => {
  selected.value = Array.isArray(timeString)
    ? timeString.join(' ~ ')
    : (timeString ?? '（未选择）');
};
</script>

<template>
  <div>
    <TimePicker
      :hour-step="1"
      :minute-step="15"
      :second-step="10"
      :need-confirm="false"
      change-on-scroll
      placeholder="每 15 分钟一档"
      @change="onChange"
    />
    <div style="margin-top: 8px">
      <Text type="secondary">最近一次选择：{{ selected }}</Text>
    </div>
  </div>
</template>
