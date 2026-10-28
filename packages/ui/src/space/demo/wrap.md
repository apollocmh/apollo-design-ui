---
order: 4
title:
  zh-CN: 自动换行
  en-US: Wrap
---

实际按钮换行，水平间距 8px、行距 16px。

Wrap real Buttons with an 8px horizontal and 16px vertical gap.

```vue
<script setup lang="ts">
import { Button, Space } from '@apollo-design/ui';
</script>
<template><Space :size="[8, 16]" wrap><Button v-for="i in 20" :key="i">Button {{ i }}</Button></Space></template>
```
