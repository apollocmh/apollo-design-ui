---
order: 3
title:
  zh-CN: 带徽标的头像
  en-US: With Badge
---

通常用于消息提示。

```vue
<script setup lang="ts">
// 对齐 antd 的 badge demo。
import { Avatar, Badge, Space } from '@apollo-design/ui';
</script>

<template>
  <Space :size="24">
    <Badge :count="1">
      <Avatar shape="square" />
    </Badge>
    <Badge dot>
      <Avatar shape="square" />
    </Badge>
  </Space>
</template>
```
