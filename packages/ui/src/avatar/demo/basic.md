---
order: 0
title:
  zh-CN: 基本
  en-US: Basic
---

头像有三种尺寸，两种形状可选。

```vue
<script setup lang="ts">
// 对齐 antd 的 basic demo。
import { Avatar, Space } from '@apollo-design/ui';
</script>

<template>
  <Space vertical :size="16">
    <Space wrap :size="16">
      <Avatar :size="64" :icon="icon()" />
      <Avatar size="large" :icon="icon()" />
      <Avatar :icon="icon()" />
      <Avatar size="small" :icon="icon()" />
      <Avatar :size="14" :icon="icon()" />
    </Space>
  </Space>
</template>
```
