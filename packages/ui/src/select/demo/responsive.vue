<script setup lang="ts">
// 对齐 antd demo/responsive.tsx（⚠️ responsive 折叠依赖 ResizeObserver 测量，
// 本轮以固定 maxTagCount 等价替换，见 README §2）
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
  { value: 'c3', label: 'Tom' },
];
</script>

<template>
  <Select mode="multiple" :options="options" :max-tag-count="2" style="width: 100%" />
</template>
