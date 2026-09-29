---
order: 10
title:
  zh-CN: 自定义页码
  en-US: Custom item render
---

`itemRender` 自定义每一项（`#itemRender` 插槽是等价通道）。

```vue
<script setup lang="ts">
// 对齐 antd `itemRender.tsx`。⚠️ 三个参数都要按 `PaginationItemRender` 的签名标注
// （`type` 是字面量联合、`element` 是 `VNodeChild`）—— 写成 `string` / `unknown` 会被
// `vue-tsc` 报 TS2322（`build:ui` 的 dts 步骤也会失败）。
import { Pagination, type PaginationItemRender } from '@apollo-design/ui';
import { h, type VNodeChild } from 'vue';

const itemRender: PaginationItemRender = (page, type, element) => {
  if (type === 'prev') return h('a', null, 'Previous');
  if (type === 'next') return h('a', null, 'Next');
  return element as VNodeChild;
};
</script>

<template>
  <Pagination :total="500" :default-current="6" :item-render="itemRender" />
</template>
```
