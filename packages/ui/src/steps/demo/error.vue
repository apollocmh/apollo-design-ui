<script setup lang="ts">
// 对齐 antd demo/error.tsx

import type { StepItem } from '@apollo-design/ui';
import { Steps } from '@apollo-design/ui';

const items: StepItem[] = [
  { title: '下载', content: '下载安装包' },
  { title: '安装', content: '运行安装程序', status: 'error' },
  { title: '完成', content: '安装完成' },
];
</script>

<template>
  <Steps :items="items" :current="1" />
</template>
