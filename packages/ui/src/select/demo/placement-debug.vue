<script setup lang="ts">
// 对齐 antd demo/placement-debug.tsx
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
</script>

<template>
  <Select :options="options" open style="width: 200px" />
</template>
