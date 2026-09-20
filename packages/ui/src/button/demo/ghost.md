---
order: 5
title:
  zh-CN: 幽灵按钮
  en-US: Ghost
---

幽灵按钮把背景变透明，常用在有色背景上。

⚠️ `ghost` 对 `solid` 变体的处理是**退化成 `outlined`**（不是加个类了事）。

⚠️ 属性顺序有讲究：`ghost` 必须写在 `danger` **之后**才不会被 `danger` 的样式压过。

```vue
<script setup lang="ts">
import { Button } from '@apollo-design/ui';
</script>

<template>
  <Button type="primary" ghost>Primary</Button>
</template>
```
