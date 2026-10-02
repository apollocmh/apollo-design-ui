<script setup lang="ts">
// 对齐 antd 的 `semantic` demo。
import { Timeline } from '@apollo-design/ui';

const dashed = { borderStyle: 'dashed' };
const items = [
  { content: 'Create a services site 2015-09-01' },
  {
    content: 'Solve initial network problems 2015-09-01',
    styles: { root: { height: '100px' }, rail: dashed },
  },
  {
    content: '...for a long time...',
    styles: { root: { height: '100px' }, rail: dashed, content: { opacity: 0.45 } },
  },
  { content: 'Technical testing 2015-09-01' },
  { content: 'Network problems being solved 2015-09-01' },
];
</script>

<template>
  <Timeline :items="items" />
</template>
