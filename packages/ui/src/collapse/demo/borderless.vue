<script setup lang="ts">
// 无边框保留分隔线；ghost 使用透明背景。
import { Collapse } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'This is panel header 1', children: 'Content' },
  { key: '2', label: 'This is panel header 2', children: 'Content' },
];
</script>

<template>
  <Collapse :items="items" :bordered="false" style="margin-bottom: 24px" />
  <Collapse :items="items" ghost />
</template>
