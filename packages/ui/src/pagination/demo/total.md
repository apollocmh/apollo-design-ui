---
order: 1
title:
  zh-CN: 总数
  en-US: Total
---

通过 `showTotal` 展示总数（`#total` 插槽是等价通道）。

```vue
<script setup lang="ts">
// 对齐 antd `total.tsx`。
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination :total="85" :show-total="(total: number) => `Total ${total} items`" />
</template>
```
