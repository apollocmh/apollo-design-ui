---
order: 3
title:
  zh-CN: 尺寸
  en-US: Size
---

`size` 三档：`small` / 默认 / `large`（各自有独立的 padding token）。

```vue
<script setup lang="ts">
// 对齐 antd `size.tsx`。
import { Tabs } from '@apollo-design/ui';
import { ref } from 'vue';

const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
];
const small = ref('1');
const large = ref('1');
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Tabs v-model:active-key="small" size="small" :items="items" />
    <Tabs v-model:active-key="large" size="large" :items="items" />
  </div>
</template>
```
