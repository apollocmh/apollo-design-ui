---
order: 6
title:
  zh-CN: 网格型内嵌卡片
  en-US: Grid card
---

一种常见的卡片内容区隔模式。

`Card.Grid` 的 `hoverable` **默认 `true`**（与 `Card` 的默认 `false` 不同）；有 `Card.Grid`
子元素时根上会加 `-contain-grid`，body 变成 `flex-wrap` 容器。

```vue
<script setup lang="ts">
// 对齐 antd 的 grid-card demo。
import { Card, CardGrid } from '@apollo-design/ui';
import type { CSSProperties } from 'vue';

const gridStyle: CSSProperties = { width: '25%', textAlign: 'center' };
</script>

<template>
  <Card title="Card Title">
    <CardGrid :style="gridStyle">Content</CardGrid>
    <CardGrid :hoverable="false" :style="gridStyle">Content</CardGrid>
    <CardGrid :style="gridStyle">Content</CardGrid>
    <CardGrid :style="gridStyle">Content</CardGrid>
    <CardGrid :style="gridStyle">Content</CardGrid>
    <CardGrid :style="gridStyle">Content</CardGrid>
    <CardGrid :style="gridStyle">Content</CardGrid>
  </Card>
</template>
```
