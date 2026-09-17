---
order: 1
title:
  zh-CN: 简洁
  en-US: Simple
---

`PRESENTED_IMAGE_SIMPLE` 是模块级常量，传给 `image` 后根元素会多出 `-normal` 类名
（高度与间距随之变化）。判据是**引用相等**，不是「长得像不像」。

```vue
<script setup lang="ts">
import { Empty, PRESENTED_IMAGE_SIMPLE } from '@apollo-design/ui';
</script>

<template>
  <Empty :image="PRESENTED_IMAGE_SIMPLE" description="No data" />
</template>
```
