<script setup lang="ts">
// 对齐 antd demo/maxCount.tsx
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
  { value: 'c3', label: 'Tom' },
];
</script>

<template>
  <Select mode="multiple" :options="options" :max-count="2" style="width: 100%" />
</template>
