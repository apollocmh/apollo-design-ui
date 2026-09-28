<script setup lang="ts">
// 对齐 antd 的 size demo
import { Segmented } from '@apollo-design/ui';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <Segmented size="large" :options="['Daily', 'Weekly', 'Monthly']" />
    <Segmented :options="['Daily', 'Weekly', 'Monthly']" />
    <Segmented size="small" :options="['Daily', 'Weekly', 'Monthly']" />
  </div>
</template>
