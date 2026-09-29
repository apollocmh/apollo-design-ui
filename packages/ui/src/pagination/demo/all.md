---
order: 2
title:
  zh-CN: 组合
  en-US: All
---

尺寸切换器 + 快速跳转 + 总数一起用（antd 文档首页的配置）。

```vue
<script setup lang="ts">
// 对齐 antd `all.tsx`。
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination
    :total="85"
    show-size-changer
    show-quick-jumper
    :show-total="(total: number) => `Total ${total} items`"
  />
</template>
```
