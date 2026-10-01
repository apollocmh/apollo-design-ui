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
import { Masonry, type MasonryItemRenderInfo } from '@apollo-design/ui';
import { h, ref } from 'vue';

const heights = [150, 50, 90, 70, 110, 150, 130, 80, 50, 90, 100, 150, 60, 50, 80];

const items = heights.map((height, index) => ({ key: `item-${index}`, data: height }));
const current = ref<number[]>([...heights]);

const bump = (index: number): void => {
  current.value = current.value.map((height, i) => (i === index ? (height % 180) + 20 : height));
};

const renderItem = ({ index }: MasonryItemRenderInfo<unknown>) =>
  h(
    'div',
    {
      style: { height: `${current.value[index]}px`, cursor: 'pointer' },
      onClick: () => bump(index),
    },
    `${index + 1} - Click`,
  );
</script>

<template>
  <Masonry fresh :columns="4" :gutter="16" :items="items" :item-render="renderItem" />
</template>
```
