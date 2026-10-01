---
order: 6
title:
  zh-CN: 废弃的 routes
  en-US: Deprecated Routes
---

⚠️ `routes` **已废弃**（用 `items`）。`breadcrumbName` 会被映射成 `title`，
`children` 会被折成 `menu.items`；每一层 `path` 会**累加**成 `href`。

```vue
<script setup lang="ts">
// 对齐 antd 的 debug-routes demo。
// ⚠️ `routes` 已废弃 —— 这里只为展示「老代码迁移过来会长什么样」。
import { Breadcrumb, type BreadcrumbItemInput } from '@apollo-design/ui';

const routes: BreadcrumbItemInput[] = [
  { path: '/home', breadcrumbName: 'Home' },
  {
    path: '/user',
    breadcrumbName: 'User',
    children: [
      { path: '/user1', breadcrumbName: 'User1' },
      { path: '/user2', breadcrumbName: 'User2' },
    ],
  },
];
</script>

<template>
  <Breadcrumb :routes="routes" />
</template>
```
