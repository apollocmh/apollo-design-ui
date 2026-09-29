---
order: 8
title:
  zh-CN: 更多
  en-US: More
---

`showLessItems` 每页显示更少的页码（±3 而不是 ±5）。

```vue
<script setup lang="ts">
// 对齐 antd `more.tsx`。
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination :default-current="6" :total="500" show-less-items />
</template>
```
