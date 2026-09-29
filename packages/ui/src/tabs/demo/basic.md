---
order: 0
title:
  zh-CN: 基本
  en-US: Basic
---

默认选中第一项。用 `v-model:activeKey` 受控。

```vue
<script setup lang="ts">
// 对齐 antd `basic.tsx`。
import { Tabs } from '@apollo-design/ui';
import { ref } from 'vue';

const activeKey = ref('1');
const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
  { key: '3', label: 'Tab 3', children: 'Content of Tab Pane 3' },
];
</script>

<template>
  <Tabs v-model:active-key="activeKey" :items="items" />
</template>
```
