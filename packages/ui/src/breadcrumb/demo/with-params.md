---
order: 4
title:
  zh-CN: 路径参数
  en-US: With Params
---

`params` 会把 `title`（以及 `path`）里的 `:key` 替换成实际值。

```vue
<script setup lang="ts">
// 对齐 antd 的 withParams demo。
import { Breadcrumb, type BreadcrumbItemInput } from '@apollo-design/ui';

const items: BreadcrumbItemInput[] = [
  { title: 'Users' },
  { title: ':id', href: '' },
];
</script>

<template>
  <Breadcrumb :items="items" :params="{ id: 1 }" />
</template>
```
