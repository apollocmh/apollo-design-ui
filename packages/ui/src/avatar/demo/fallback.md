---
order: 6
title:
  zh-CN: 图片不存在时
  en-US: Fallback
---

图片不存在时，如果 `src` 本身是个 ReactElement/VNode，会尝试回退到 `src`，否则尝试回退到 `icon`，最后回退到显示 `children`。

```vue
<script setup lang="ts">
// 对齐 antd 的 fallback demo。
import { Avatar, Space } from '@apollo-design/ui';
</script>

<template>
  <Space>
    <Avatar shape="circle" src="./not-exist-avatar.png">A</Avatar>
    <Avatar shape="circle" src="./not-exist-avatar.png">ABC</Avatar>
  </Space>
</template>
```
