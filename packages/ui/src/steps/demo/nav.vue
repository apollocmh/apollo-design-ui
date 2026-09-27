<script setup lang="ts">
// 对齐 antd demo/nav.tsx
import { Steps } from '@apollo-design/ui';
import { ref } from 'vue';

const current = ref(0);
const items = [
  { title: '订单详情', content: '查看订单信息' },
  { title: '物流信息', content: '查看物流状态' },
  { title: '售后', content: '申请售后' },
];
</script>

<template>
  <Steps type="navigation" :items="items" :current="current" @change="(c: number) => (current = c)" />
</template>
