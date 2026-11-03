<script setup lang="ts">
// 用不同高度的原生内容块展示瀑布流的排列。
import { Masonry } from '@apollo-design/ui';

const tileStyle = {
  padding: '8px',
  background: 'var(--apollo-color-bg-container)',
  color: 'var(--apollo-color-text)',
  border: '1px solid var(--apollo-color-border-secondary)',
  borderRadius: '8px',
  boxSizing: 'border-box',
} as const;

const heights = [150, 50, 90, 70, 110, 150, 130, 80, 50, 90, 100, 150, 60, 50, 80];

const items = heights.map((height, index) => ({ key: `item-${index}`, data: height }));
</script>

<template>
  <Masonry :columns="4" :gutter="16" :items="items">
    <template #item="{ data, index }">
      <div :style="{ height: `${data}px`, ...tileStyle }">{{ index + 1 }}</div>
    </template>
  </Masonry>
</template>
