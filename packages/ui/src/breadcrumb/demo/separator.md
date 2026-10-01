---
order: 1
title:
  zh-CN: 分隔符
  en-US: Separator
---

用 `separator` 覆盖默认的 `/`。

```vue
<script setup lang="ts">
// 对齐 antd 的 separator demo。
import { Breadcrumb, type BreadcrumbItemInput } from '@apollo-design/ui';

const items: BreadcrumbItemInput[] = [
  { title: 'Home' },
  { title: 'Application Center', href: '' },
  { title: 'Application List', href: '' },
  { title: 'An Application' },
];
</script>

<template>
  <Breadcrumb separator=">" :items="items" />
</template>
```
