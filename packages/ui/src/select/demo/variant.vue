<script setup lang="ts">
// 对齐 antd demo/variant.tsx
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: '杰克' },
  { value: 'b2', label: '露西' },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <Select :options="options" variant="outlined" style="width: 120px" placeholder="outlined" />
    <Select :options="options" variant="filled" style="width: 120px" placeholder="filled" />
    <Select :options="options" variant="borderless" style="width: 120px" placeholder="borderless" />
    <Select :options="options" variant="underlined" style="width: 120px" placeholder="underlined" />
  </div>
</template>
