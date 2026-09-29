---
order: 1
title:
  zh-CN: 禁用
  en-US: Disabled
---

`items[].disabled` 的页签不可点、**焦点也跳不过去**。

```vue
<script setup lang="ts">
// 对齐 antd `disabled.tsx`。
import { Tabs } from '@apollo-design/ui';
import { ref } from 'vue';

const activeKey = ref('1');
const items = [
  { key: '1', label: 'Tab 1', children: 'Tab 1' },
  { key: '2', label: 'Tab 2', children: 'Tab 2', disabled: true },
  { key: '3', label: 'Tab 3', children: 'Tab 3' },
];
</script>

<template>
  <Tabs v-model:active-key="activeKey" :items="items" />
</template>
```
