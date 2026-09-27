<script setup lang="ts">
// 对齐 antd demo/max-count.tsx
import { Steps } from '@apollo-design/ui';

const items = Array.from({ length: 8 }, (_, i) => ({
  title: `步骤${i + 1}`,
  content: `第 ${i + 1} 步`,
}));
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Steps :items="items" :current="4" :max-count="4" />
    <Steps :items="items" :current="7" :max-count="4" />
  </div>
</template>
