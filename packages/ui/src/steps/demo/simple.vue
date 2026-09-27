<script setup lang="ts">
// 对齐 antd demo/simple.tsx
import { Steps } from '@apollo-design/ui';

const items = [
  { title: '已完成', content: '这里是该步骤的说明文字' },
  { title: '进行中', content: '这里是该步骤的说明文字' },
  { title: '待运行', content: '这里是该步骤的说明文字' },
];
</script>

<template>
  <Steps :items="items" :current="1" />
</template>
