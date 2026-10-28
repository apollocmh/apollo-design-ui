---
order: 3
title:
  zh-CN: 自动换行
  en-US: Wrap
---

真实按钮按可用宽度自动换行，保留原生 Tab 顺序。

```vue
<script setup lang="ts">
import { Flex } from '@apollo-design/ui';
</script>

<template>
  <Flex wrap gap="small">
    <button v-for="i in 24" :key="i" type="button">Button</button>
  </Flex>
</template>
```
