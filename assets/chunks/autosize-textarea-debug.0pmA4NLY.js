const e=`<script setup lang="ts">
// 对齐 antd demo/autosize-textarea-debug.tsx
import { Flex, Mentions } from '@apollo-design/ui';

const options = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
  { value: 'yesmeck', label: 'yesmeck' },
];
<\/script>

<template>
  <Flex vertical :gap="32">
    <Mentions placeholder="can resize" :options="options" />
    <Mentions placeholder="disable resize" style="resize: none" :options="options" />
  </Flex>
</template>
`;export{e as default};
