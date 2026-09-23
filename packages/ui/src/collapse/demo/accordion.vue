<script setup lang="ts">
// 对齐 antd 的 accordion demo
import { Collapse } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'This is panel header 1', children: 'Content' },
  { key: '2', label: 'This is panel header 2', children: 'Content' },
  { key: '3', label: 'This is panel header 3', children: 'Content' },
];
</script>

<template>
  <Collapse :items="items" accordion />
</template>
