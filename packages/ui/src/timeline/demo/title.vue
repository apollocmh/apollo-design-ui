<script setup lang="ts">
// 对齐 antd 的 `title` demo。
import { Radio, RadioGroup, Timeline } from '@apollo-design/ui';
import { ref } from 'vue';

const mode = ref<'start' | 'alternate' | 'end'>('start');
const items = [
  { title: '2015-09-01', content: 'Create a services' },
  { title: '2015-09-01 09:12:11', content: 'Solve initial network problems' },
  { content: 'Technical testing' },
  { title: '2015-09-01 09:12:11', content: 'Network problems being solved' },
];
</script>

<template>
  <RadioGroup v-model:value="mode" :style="{ marginBottom: '20px' }">
    <Radio value="start">Start</Radio>
    <Radio value="end">End</Radio>
    <Radio value="alternate">Alternate</Radio>
  </RadioGroup>
  <Timeline :mode="mode" :items="items" />
</template>
