---
order: 2
title:
  zh-CN: 独立分隔符
  en-US: Separator Component
---

用 `type: 'separator'` 的项插入**独立**分隔符（可以与默认分隔符并存）。
把 `separator` 设为 `''` 可以去掉自动分隔符。

```vue
<script setup lang="ts">
// 对齐 antd 的 separator-component demo。
import { Breadcrumb, type BreadcrumbItemInput } from '@apollo-design/ui';

const items: BreadcrumbItemInput[] = [
  { title: 'Location' },
  { type: 'separator', separator: ':' },
  { href: '', title: 'Application Center' },
  { type: 'separator' },
  { href: '', title: 'Application List' },
  { type: 'separator' },
  { title: 'An Application' },
];
</script>

<template>
  <Breadcrumb separator="" :items="items" />
</template>
```
