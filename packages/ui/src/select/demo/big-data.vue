<script setup lang="ts">
// 对齐 antd demo/big-data.tsx：1 万条选项走虚拟滚动
import { Select } from '@apollo-design/ui';

const options = Array.from({ length: 10000 }, (_, i) => ({
  value: String(i),
  label: `option ${i}`,
}));
</script>

<template>
  <Select :options="options" show-search style="width: 200px" placeholder="10,000 options" />
</template>
