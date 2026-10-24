---
order: 10
title:
  zh-CN: 自定义页码
  en-US: Custom item render
---

`#itemRender="{ page, type, element }"` 自定义每一项；空槽压住默认内容。

```vue
<script setup lang="ts">
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination :total="500" :default-current="6">
    <template #itemRender="{ type, element }">
      <a v-if="type === 'prev'">Previous</a>
      <a v-else-if="type === 'next'">Next</a>
      <component :is="element" v-else />
    </template>
  </Pagination>
</template>
```
