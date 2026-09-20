---
order: 1
title:
  zh-CN: 标题组件
  en-US: Title
---

`level` 取 `1`~`5`，分别渲染 `h1`~`h5`。默认值是 `1`。

⚠️ 非法 `level`（例如 `6`）会**退回 `h1` 并告警** —— 这是 antd 的既定行为，
而不是「渲染成 `h6`」。

```vue
<script setup lang="ts">
import { Title } from '@apollo-design/ui';
</script>

<template>
  <Title :level="1">h1. Apollo Design</Title>
  <Title :level="2">h2. Apollo Design</Title>
  <Title :level="3">h3. Apollo Design</Title>
  <Title :level="4">h4. Apollo Design</Title>
  <Title :level="5">h5. Apollo Design</Title>
</template>
```
