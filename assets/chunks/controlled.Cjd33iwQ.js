const n=`<script setup lang="ts">
// 对齐 antd \`controlled.tsx\`。
import { Pagination } from '@apollo-design/ui';
import { ref } from 'vue';

const current = ref(3);
const onChange = (page: number): void => {
  console.log(page);
  current.value = page;
};
<\/script>

<template>
  <Pagination v-model:current="current" :total="50" @change="onChange" />
</template>
`;export{n as default};
