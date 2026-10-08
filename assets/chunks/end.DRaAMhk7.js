const n=`<script setup lang="ts">
// 对齐 antd 的 \`end\` demo。

import { ClockCircleOutlined } from '@apollo-design/icons';
import { Timeline } from '@apollo-design/ui';
import { h } from 'vue';

const items = [
  { content: 'Create a services site 2015-09-01' },
  { content: 'Solve initial network problems 2015-09-01' },
  {
    icon: h(ClockCircleOutlined),
    color: 'red',
    content: 'Technical testing 2015-09-01',
  },
  { content: 'Network problems being solved 2015-09-01' },
];
<\/script>

<template>
  <Timeline mode="end" :items="items" />
</template>
`;export{n as default};
