---
order: 6
title:
  zh-CN: 居中
  en-US: Centered
---

`centered` 让卡片式页签整体居中。

```vue
<script setup lang="ts">
// 对齐 antd `centered.tsx`。
import { Tabs } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
];
</script>

<template>
  <Tabs default-active-key="1" type="card" centered :items="items" />
</template>
```
