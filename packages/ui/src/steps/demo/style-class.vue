<script setup lang="ts">
// 对齐 antd demo/style-class.tsx（语义 classNames / styles）
import { Steps } from '@apollo-design/ui';

const items = [
  { title: '第一步', content: '说明' },
  { title: '第二步', content: '说明' },
];
</script>

<template>
  <Steps
    :items="items"
    :current="1"
    :class-names="{ root: 'demo-steps-root', itemTitle: 'demo-steps-title' }"
    :styles="{ itemIcon: { fontSize: '18px' } }"
  />
</template>
