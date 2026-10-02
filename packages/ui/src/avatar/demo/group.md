---
order: 4
title:
  zh-CN: 头像组合
  en-US: Avatar.Group
---

头像组合展现。`size` 与 `shape` 会经 context 透传给所有子头像。

```vue
<script setup lang="ts">
// 对齐 antd 的 group demo。
import { Avatar, AvatarGroup } from '@apollo-design/ui';
</script>

<template>
  <AvatarGroup>
    <Avatar>K</Avatar>
    <Avatar>L</Avatar>
  </AvatarGroup>
</template>
```
