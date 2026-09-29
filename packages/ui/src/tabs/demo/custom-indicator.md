---
order: 10
title:
  zh-CN: 自定义指示条
  en-US: Custom indicator
---

`indicator` 的 `align`（start/center/end）与 `size`（定长）。

```vue
<script setup lang="ts">
// 对齐 antd `custom-indicator.tsx`（只演示 align 与 size 两个通道；
// 上游 demo 里的 `styles.indicator` 走的是语义槽，本仓同样支持 `styles`）。
import { Tabs } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Tabs default-active-key="1" :items="items" :indicator="{ align: 'start' }" />
    <Tabs default-active-key="1" :items="items" :indicator="{ size: 20 }" />
    <Tabs default-active-key="1" :items="items" :indicator="{ align: 'end', size: (origin: number) => origin * 0.5 }" />
  </div>
</template>
```
