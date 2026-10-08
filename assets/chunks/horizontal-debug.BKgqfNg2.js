const e=`<script setup lang="ts">
// 对齐 antd 的 \`horizontal-debug\` demo。
import { Divider, Flex, Timeline } from '@apollo-design/ui';

const longText = 'Long Text '.repeat(5);
const items = [
  { title: longText, content: longText },
  { content: longText },
  { content: longText },
  { title: longText, content: longText },
];
const sharedStyles = { item: { boxShadow: '0 0 1px rgba(255,0,0,0.6)' } };
<\/script>

<template>
  <Flex vertical>
    <Timeline :items="items" orientation="horizontal" mode="start" :styles="sharedStyles" />
    <Divider />
    <Timeline :items="items" orientation="horizontal" mode="end" :styles="sharedStyles" />
    <Divider />
    <Timeline :items="items" orientation="horizontal" mode="alternate" :styles="sharedStyles" />
  </Flex>
</template>
`;export{e as default};
