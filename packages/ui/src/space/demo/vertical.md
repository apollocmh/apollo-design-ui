---
order: 1
title:
  zh-CN: 垂直间距
  en-US: Vertical
---

垂直排列真实 Card；使用 `style="display: flex"` 撑满容器。

Stack real Cards vertically and stretch the layout with native style.

```vue
<script setup lang="ts">
import { Card, Space } from '@apollo-design/ui';
</script>
<template>
  <Space orientation="vertical" size="medium" style="display: flex">
    <Card v-for="i in 3" :key="i" title="Card" size="small"><p>Card content</p><p>Card content</p></Card>
  </Space>
</template>
```
