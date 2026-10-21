<script setup lang="ts">
// 对齐 antd 的 12hours demo：use12Hours 增加上下午列，format 决定输入框展示形态。
import type { TimePickerEmits } from '@apollo-design/ui';
import { Space, Text, TimePicker } from '@apollo-design/ui';
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
    <Space wrap>
      <TimePicker use12-hours placeholder="h:mm:ss A" @change="onChange" />
      <TimePicker
        use12-hours
        format="h:mm:ss A"
        placeholder="h:mm:ss A"
        @change="onChange"
      />
      <TimePicker use12-hours format="h:mm a" placeholder="h:mm a" @change="onChange" />
    </Space>
    <div style="margin-top: 8px">
      <Text type="secondary">最近一次选择：{{ selected }}</Text>
    </div>
  </div>
</template>
