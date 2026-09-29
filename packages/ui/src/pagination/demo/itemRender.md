---
order: 10
title:
  zh-CN: 自定义页码
  en-US: Custom item render
---

`itemRender` 自定义每一项（`#itemRender` 插槽是等价通道）。

```vue
<script setup lang="ts">
// 对齐 antd `itemRender.tsx`。
import { Pagination } from '@apollo-design/ui';
import { h } from 'vue';

const itemRender = (page: number, type: string, element: unknown) => {
  if (type === 'prev') return h('a', null, 'Previous');
  if (type === 'next') return h('a', null, 'Next');
  return element;
};
</script>

<template>
  <Pagination :total="500" :default-current="6" :item-render="itemRender" />
</template>
```
