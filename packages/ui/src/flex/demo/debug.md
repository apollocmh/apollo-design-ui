---
order: 5
title:
  zh-CN: 调试专用
  en-US: Debug
---

垂直 / 水平两种形态的空隙基线（antd 标记为 `debug` 的调试 demo）。

```vue
<script setup lang="ts">
import { Flex } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical>
    <div v-for="i in 4" :key="i" :style="{ height: '60px' }" />
  </Flex>
</template>
```
