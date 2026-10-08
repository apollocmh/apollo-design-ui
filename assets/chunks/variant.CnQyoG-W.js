const n=`<script setup lang="ts">
// 对齐 antd 的 \`variant\` demo。
import { Timeline } from '@apollo-design/ui';

const items = [
  { content: 'Create a services site 2015-09-01' },
  { content: 'Solve initial network problems 2015-09-01' },
  { content: 'Technical testing 2015-09-01' },
  { content: 'Network problems being solved 2015-09-01' },
];
<\/script>

<template>
  <Timeline variant="filled" :items="items" />
</template>
`;export{n as default};
