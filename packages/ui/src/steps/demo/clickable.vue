<script setup lang="ts">
import { Steps } from '@apollo-design/ui';
import { ref } from 'vue';

const current = ref(1);
const items = [
  { title: '登录', content: '第一步' },
  { title: '下单', content: '第二步' },
  { title: '支付', content: '第三步' },
];
</script>

<template>
  <Steps v-model:current="current" :items="items" />
</template>
