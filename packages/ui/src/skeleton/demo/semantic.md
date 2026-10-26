---
order: 5
title:
  zh-CN: 语义化样式
  en-US: Semantic
---

`classNames` / `styles` 各支持 6 个键，与 DOM 结构一一对应：
`root` / `header` / `section` / `avatar` / `title` / `paragraph`。

主组件同时支持对象与函数，函数读取当前`{ props }`；原生`class/style`作用于根，区块配置的class/style与对应语义配置合并。

```vue
<script setup lang="ts">
import { Skeleton } from '@apollo-design/ui';
</script>

<template>
  <Skeleton avatar :class-names="{ root: 'demo-root' }" />
</template>
```
