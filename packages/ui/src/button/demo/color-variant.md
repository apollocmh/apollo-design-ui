---
order: 9
title:
  zh-CN: 颜色与变体
  en-US: Color and variant
---

`color` + `variant` 是 v6 的新写法，**同时给出时优先级最高**（压过 `type` / `danger`）。

- `color`：16 个预设语义色（含 `default` / `primary` / `danger` + 13 个色板色）
- `variant`：`outlined` / `dashed` / `solid` / `filled` / `text` / `link`

⚠️ `filled` 在 `ButtonTypeMap` 里**没有**映射 ⇒ 只能由 `variant` 显式传入。

```vue
<script setup lang="ts">
import { Button } from '@apollo-design/ui';
</script>

<template>
  <Button color="blue" variant="solid">Blue solid</Button>
</template>
```
