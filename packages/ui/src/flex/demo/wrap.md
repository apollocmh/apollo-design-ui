---
order: 3
title:
  zh-CN: 自动换行
  en-US: Wrap
---

`wrap` 使元素多行显示（`flex-wrap: wrap`）。

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
