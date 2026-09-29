---
order: 6
title:
  zh-CN: 跳转
  en-US: Jump
---

`showQuickJumper` 快速跳转；`{ goButton: true }` 加一个确认按钮。

```vue
<script setup lang="ts">
// 对齐 antd `jump.tsx`。
import { Pagination } from '@apollo-design/ui';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Pagination show-quick-jumper :default-current="3" :total="500" />
    <Pagination show-quick-jumper :default-current="3" :total="500" />
  </div>
</template>
```
