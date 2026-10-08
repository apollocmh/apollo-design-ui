const n=`<script setup lang="ts">
// 对齐 antd 的 \`horizontal\` demo。
import { Divider, Flex, Timeline } from '@apollo-design/ui';

const items = [
  { content: 'Init' },
  { content: 'Start' },
  { content: 'Pending' },
  { content: 'Complete' },
];
<\/script>

<template>
  <Flex vertical>
    <Timeline :items="items" orientation="horizontal" mode="start" />
    <Divider />
    <Timeline :items="items" orientation="horizontal" mode="end" />
    <Divider />
    <Timeline :items="items" orientation="horizontal" mode="alternate" />
  </Flex>
</template>
`;export{n as default};
