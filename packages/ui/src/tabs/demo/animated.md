---
order: 12
title:
  zh-CN: 动画
  en-US: Animated
---

`animated` 三形态；默认是 `{ inkBar: true, tabPane: false }`（**面板默认无动画**）。

```vue
<script setup lang="ts">
// 对齐 antd `animated.tsx`。
import { Tabs } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Tabs default-active-key="1" :items="items" />
    <Tabs default-active-key="1" :items="items" :animated="true" />
    <Tabs default-active-key="1" :items="items" :animated="{ inkBar: true, tabPane: false }" />
  </div>
</template>
```
