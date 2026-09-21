---
order: 12
title:
  zh-CN: useBreakpoint Hook
  en-US: useBreakpoint
---

`useBreakpoint` 返回各断点的命中状态（基于 `window.matchMedia` 订阅）。

```vue
<script setup lang="ts">
import { useBreakpoint } from '@apollo-design/ui';

const screens = useBreakpoint();
</script>

<template>
  <div>xs: {{ screens.xs }}</div>
</template>
```
