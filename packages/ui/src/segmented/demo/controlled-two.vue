<script setup lang="ts">
// 对齐 antd 的 controlled-two demo：两个受控 Segmented 共享同一份状态。
import { Segmented, type SegmentedValue } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<SegmentedValue>('AND');
const options = ['AND', 'OR', 'NOT'];
</script>

<template>
  <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 12px">
    <Segmented :options="options" :value="value" @update:value="value = $event" />
    <Segmented :options="options" :value="value" @update:value="value = $event" />
    <div>当前值：{{ value }}</div>
  </div>
</template>
