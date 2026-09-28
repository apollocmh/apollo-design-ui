<script setup lang="ts">
// 对齐 antd 的 disabled demo
import { Segmented } from '@apollo-design/ui';

const options = [
  { label: 'Daily', value: 'Daily' },
  { label: 'Weekly', value: 'Weekly', disabled: true },
  { label: 'Monthly', value: 'Monthly' },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <Segmented disabled :options="options" />
    <Segmented :options="options" />
  </div>
</template>
