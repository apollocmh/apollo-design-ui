---
order: 1
title:
  zh-CN: 类型
  en-US: Type
---

支持三种类型：**图标**、**字符**和**图片**。

```vue
<script setup lang="ts">
// 对齐 antd 的 type demo。⚠️ 图片用 **data URI**（外网图片会污染 L6 基线）
import { Avatar, Space } from '@apollo-design/ui';
import { h } from 'vue';

const url =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
</script>

<template>
  <Space :size="16" wrap>
    <Avatar :icon="icon()" />
    <Avatar>U</Avatar>
    <Avatar :size="40">USER</Avatar>
    <Avatar :src="url" alt="avatar" />
    <Avatar :src="h('img', { draggable: false, src: url, alt: 'avatar' })" />
  </Space>
</template>
```
