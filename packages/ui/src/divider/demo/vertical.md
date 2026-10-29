---
order: 4
title:
  zh-CN: 垂直分割线
  en-US: Vertical
---

`orientation="vertical"` 与 `vertical` 均支持；同时配置时 orientation 优先。根声明垂直 separator 语义；标题槽在该模式下忽略并告警。两侧链接保留原生键盘与焦点行为。

```vue
<script setup lang="ts">
import { Divider } from '@apollo-design/ui';
</script>

<template>
  Text
  <Divider orientation="vertical" />
  <a href="#" aria-label="Apollo Design component examples">Link</a>
  <Divider vertical />
  <a href="#" aria-label="Apollo Design component examples">Link</a>
</template>

<style scoped>
a { color: inherit; text-decoration: underline; }
</style>
```
