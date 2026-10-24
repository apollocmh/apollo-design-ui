---
order: 2
title:
  zh-CN: 组合
  en-US: All
---

尺寸切换器、快速跳转和原生总数槽组合。

```vue
<script setup lang="ts">
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination :total="85" show-size-changer show-quick-jumper>
    <template #total="{ total }">Total {{ total }} items</template>
  </Pagination>
</template>
```
