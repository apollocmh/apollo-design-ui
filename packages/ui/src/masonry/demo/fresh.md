---
order: 3
title:
  zh-CN: 内容变化
  en-US: Fresh
---

条目内容高度会变时用 `fresh` —— 它给**每个条目**各挂一个 `ResizeObserver`，
点一下就重新量测并重排。

⚠️ `fresh` **不改变 DOM 结构**（观察器不产节点，上游的 `ResizeObserver` 是 `cloneElement`）。
与 antd 的 demo 的差异：高度用确定值而不是 `Math.random()`。

```vue
<script setup lang="ts">
// 对齐 antd 的 fresh demo：条目内容的高度会变 ⇒ 需要 `fresh`（每个条目各挂一个
// ResizeObserver）。`fresh` 还会持续观察 CSS 过渡期间的高度变化。
import { Masonry } from '@apollo-design/ui';
import { ref } from 'vue';

const tileStyle = {
  padding: '8px',
  background: '#fff',
  border: '1px solid #f0f0f0',
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
  <Masonry fresh :columns="4" :gutter="16" :items="items">
    <template #item="{ index }">
      <div :style="{ height: `${current[index]}px`, ...tileStyle, cursor: 'pointer', transition: 'height 0.3s' }" @click="bump(index)">{{ index + 1 }} - Click</div>
    </template>
  </Masonry>
</template>

```
