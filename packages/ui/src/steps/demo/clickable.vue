<script setup lang="ts">
// 对齐 antd demo/clickable.tsx
import { Steps } from '@apollo-design/ui';
import { ref } from 'vue';

const current = ref(1);
const items = [
  { title: '登录', content: '第一步' },
  { title: '下单', content: '第二步' },
  { title: '支付', content: '第三步' },
];
const onChange = (c: number) => {
  current.value = c;
};
</script>

<template>
  <Steps :items="items" :current="current" @change="onChange" />
</template>
