---
order: 4
title:
  zh-CN: 组合使用
  en-US: Combination
---

嵌套 `Flex` 完成复杂布局（Card / Typography 用原生元素等价替换）。

```vue
<script setup lang="ts">
import { Flex } from '@apollo-design/ui';
</script>

<template>
  <Flex justify="space-between">
    <Flex vertical align="flex-end" justify="space-between" style="padding: 32px">
      <button type="button">Get Started</button>
    </Flex>
  </Flex>
</template>
```
