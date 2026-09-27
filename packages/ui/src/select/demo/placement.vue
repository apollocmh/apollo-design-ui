<script setup lang="ts">
// 对齐 antd demo/placement.tsx
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <Select :options="options" placement="topLeft" style="width: 200px" placeholder="topLeft" />
    <Select :options="options" placement="topRight" style="width: 200px" placeholder="topRight" />
    <Select :options="options" placement="bottomLeft" style="width: 200px" placeholder="bottomLeft" />
    <Select :options="options" placement="bottomRight" style="width: 200px" placeholder="bottomRight" />
  </div>
</template>
