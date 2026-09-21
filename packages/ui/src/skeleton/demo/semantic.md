---
order: 5
title:
  zh-CN: 语义化样式
  en-US: Semantic
---

`classNames` / `styles` 各支持 6 个键，与 DOM 结构一一对应：
`root` / `header` / `section` / `avatar` / `title` / `paragraph`。

⚠️ 本组件的语义化**支持函数式**（`classNames={(info) => ...}`），
这一点比 divider / button / typography 宽 —— 差异登记在 README §7.4。

```vue
<script setup lang="ts">
import { Skeleton } from '@apollo-design/ui';
</script>

<template>
  <Skeleton avatar :class-names="{ root: 'demo-root' }" />
</template>
```
