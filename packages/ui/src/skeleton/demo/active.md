---
order: 4
title:
  zh-CN: 动画与圆角
  en-US: Active and round
---

`active` 让灰块有呼吸动画；`round` 把标题与段落的圆角拉到「胶囊」级别
（`-round` 是**根元素**上的类名，作用于后代的标题/段落）。

```vue
<script setup lang="ts">
import { Flex, Skeleton } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical gap="large">
    <Skeleton active />
    <Skeleton active round />
  </Flex>
</template>
```
