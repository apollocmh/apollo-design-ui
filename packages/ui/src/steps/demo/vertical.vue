<script setup lang="ts">
// 对齐 antd demo/vertical.tsx
import { Steps } from '@apollo-design/ui';

const items = [
  { title: '已完成', content: '2016-09-26' },
  { title: '进行中', content: '2016-09-27' },
  { title: '待运行', content: '2016-09-28' },
  { title: '待运行', content: '2016-09-29' },
];
</script>

<template>
  <Steps orientation="vertical" :items="items" :current="1" style="height: 220px" />
</template>
