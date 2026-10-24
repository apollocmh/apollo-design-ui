---
order: 1
title:
  zh-CN: 总数
  en-US: Total
---

通过 `#total="{ total, range }"` 展示总数与当前范围。

```vue
<script setup lang="ts">
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination :total="85">
    <template #total="{ total }">Total {{ total }} items</template>
  </Pagination>
</template>
```
