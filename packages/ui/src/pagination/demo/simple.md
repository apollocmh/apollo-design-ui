---
order: 5
title:
  zh-CN: 简洁
  en-US: Simple
---

`simple` 简化模式：只有上一页/下一页 + `当前 / 总数`（可输入）。

```vue
<script setup lang="ts">
// 对齐 antd `simple.tsx`。
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination simple :default-current="2" :total="50" />
</template>
```
