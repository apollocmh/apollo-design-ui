---
order: 5
title:
  zh-CN: maxCount 包含溢出元素
  en-US: maxCount includes overflow
---

使用 HOC 封装 `Avatar.Group`，添加 `overflowInFinal` 属性。开启后 `max.count` 表示总共显示的元素数量，会预留 1 个位置给溢出指示器。

```vue
<script setup lang="ts">
// 对齐 antd 的 max-count demo。
import { Avatar, AvatarGroup } from '@apollo-design/ui';
</script>

<template>
  <AvatarGroup :max="{ count: 2 }">
    <Avatar>A</Avatar>
    <Avatar>B</Avatar>
    <Avatar>C</Avatar>
  </AvatarGroup>
</template>
```
