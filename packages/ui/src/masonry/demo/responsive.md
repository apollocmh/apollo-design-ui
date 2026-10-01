---
order: 1
title:
  zh-CN: 响应式
  en-US: Responsive
---

列数与间距都支持按断点配置 —— 命中规则是「从大到小取第一个已配置的断点」。

```vue
<script setup lang="ts">
import { Masonry, type MasonryItemRenderInfo } from '@apollo-design/ui';
import { h } from 'vue';

const heights = [120, 55, 85, 160, 95, 140, 75, 110, 65, 130, 90, 145, 55, 100, 80];

const items = heights.map((height, index) => ({ key: `item-${index}`, data: height }));

const renderItem = ({ data, index }: MasonryItemRenderInfo<unknown>) =>
  h('div', { style: { height: `${Number(data)}px` } }, String(index + 1));
</script>

<template>
  <Masonry
    :columns="{ xs: 1, sm: 2, md: 3, lg: 4 }"
    :gutter="{ xs: 8, sm: 12, md: 16 }"
    :items="items"
    :item-render="renderItem"
  />
</template>
```
