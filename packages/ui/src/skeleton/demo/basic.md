---
order: 1
title:
  zh-CN: 基础
  en-US: Basic
---

不传任何 props 时的默认形态：`avatar` 为 `false`、`title` 与 `paragraph` 均为 `true`。
所以**只有 `-section`、没有 `-header`**，段落默认 3 行。

```vue
<script setup lang="ts">
import { Skeleton } from '@apollo-design/ui';
</script>

<template>
  <Skeleton />
</template>
```
