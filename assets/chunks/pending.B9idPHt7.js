const e=`<script setup lang="ts">
// 对齐 antd 的 \`pending\` demo。
import { Button, Flex, Timeline } from '@apollo-design/ui';
import { ref } from 'vue';

const reverse = ref(false);
const items = [
  { content: 'Create a services site 2015-09-01' },
  { content: 'Solve initial network problems 2015-09-01' },
  { content: 'Technical testing 2015-09-01' },
  { loading: true, content: 'Recording...' },
];
<\/script>

<template>
  <Flex vertical :gap="16" align="flex-start">
    <Timeline :reverse="reverse" :items="items" />
    <Button type="primary" @click="reverse = !reverse">Toggle Reverse</Button>
  </Flex>
</template>
`;export{e as default};
