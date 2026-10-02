---
order: 2
title:
  zh-CN: 简洁卡片
  en-US: Simple card
---

只包含内容区域。

没有 `title` / `extra` / `tabList` ⇒ **不渲染 head**（`isRenderable` 判据）。

```vue
<script setup lang="ts">
// 对齐 antd 的 simple demo。
import { Card } from '@apollo-design/ui';
</script>

<template>
  <Card :style="{ width: '300px' }">
    <p>Card content</p>
    <p>Card content</p>
    <p>Card content</p>
  </Card>
</template>
```
