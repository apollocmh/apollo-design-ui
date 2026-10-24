<script setup lang="ts">
// 对齐 antd 的 responsive demo：列数与间距都按断点给。
import { Masonry } from '@apollo-design/ui';

const tileStyle = {
  padding: '8px',
  background: '#fff',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  boxSizing: 'border-box',
} as const;

const heights = [120, 55, 85, 160, 95, 140, 75, 110, 65, 130, 90, 145, 55, 100, 80];

const items = heights.map((height, index) => ({ key: `item-${index}`, data: height }));
</script>

<template>
  <Masonry
    :columns="{ xs: 1, sm: 2, md: 3, lg: 4 }"
    :gutter="{ xs: 8, sm: 12, md: 16 }"
    :items="items"
  >
    <template #item="{ data, index }">
      <div :style="{ height: `${data}px`, ...tileStyle }">{{ index + 1 }}</div>
    </template>
  </Masonry>
</template>
