---
order: 1
title:
  zh-CN: 无边框
  en-US: Borderless
---

在灰色背景上使用无边框的卡片。

`variant="borderless"` 时不加 `-bordered` 类名，改用三级阴影（`boxShadowTertiary`）。

```vue
<script setup lang="ts">
// 对齐 antd 的 border-less demo。
import { Card } from '@apollo-design/ui';
</script>

<template>
  <div style="padding: 24px; background: var(--apollo-color-fill-alter); border-radius: var(--apollo-border-radius-lg)">
    <Card title="Card title" variant="borderless" :style="{ width: '300px', maxWidth: '100%' }">
      <p>Card content</p>
      <p>Card content</p>
      <p>Card content</p>
    </Card>
  </div>
</template>
```
