<script setup lang="ts">
// 对齐 antd 的 fresh demo：条目内容的高度会变 ⇒ 需要 `fresh`（每个条目各挂一个
// ResizeObserver）。`fresh` 还会持续观察 CSS 过渡期间的高度变化。
import { Button, Masonry } from '@apollo-design/ui';
import { ref } from 'vue';

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
const current = ref<number[]>([...heights]);

/** ⚠️ antd 的 demo 用 `Math.random()` —— 这里用**确定值**（每次点：换到下一档）。 */
const bump = (index: number): void => {
  current.value = current.value.map((height, i) => (i === index ? (height % 180) + 20 : height));
};
</script>

<template>
  <Masonry fresh :columns="{ xs: 2, sm: 3, lg: 4 }" :gutter="16" :items="items">
    <template #item="{ index }">
      <Button :style="{ height: `${current[index]}px`, width: '100%', ...tileStyle, whiteSpace: 'normal', transition: 'height 0.3s' }" @click="bump(index)">{{ index + 1 }} - Click</Button>
    </template>
  </Masonry>
</template>
