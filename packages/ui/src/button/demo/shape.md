---
order: 8
title:
  zh-CN: 按钮形状
  en-US: Shape
---

`shape` 取 `default` 与 `square` 时**不**产出 `-{shape}` 类名，其余（`circle` / `round`）产出。

```vue
<script setup lang="ts">
import { Button } from '@apollo-design/ui';
</script>

<template>
  <Button type="primary" shape="round">Round</Button>
</template>
```
