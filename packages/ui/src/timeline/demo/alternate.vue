<script setup lang="ts">
// 对齐 antd 的 `alternate` demo。

import { ClockCircleOutlined } from '@apollo-design/icons';
import { Timeline } from '@apollo-design/ui';
import { h } from 'vue';

const items = [
  { content: 'Create a services site 2015-09-01' },
  { content: 'Solve initial network problems 2015-09-01', color: 'green' },
  {
    icon: h(ClockCircleOutlined, { style: { fontSize: '16px' } }),
    content:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
  },
  { color: 'red', content: 'Network problems being solved 2015-09-01' },
  { content: 'Create a services site 2015-09-01' },
  {
    icon: h(ClockCircleOutlined, { style: { fontSize: '16px' } }),
    content: 'Technical testing 2015-09-01',
  },
];
</script>

<template>
  <Timeline mode="alternate" :items="items" />
</template>
