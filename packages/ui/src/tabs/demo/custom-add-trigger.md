---
order: 8
title:
  zh-CN: 自定义新增触发器
  en-US: Custom add trigger
---

`addIcon` 换掉「+」的图标。

```vue
<script setup lang="ts">
// 对齐 antd `custom-add-trigger.tsx`。
import { PlusCircleOutlined } from '@apollo-design/icons';
import { Tabs } from '@apollo-design/ui';
import { h } from 'vue';

const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
];
</script>

<template>
  <Tabs
    default-active-key="1"
    type="editable-card"
    :items="items"
    :add-icon="h(PlusCircleOutlined)"
    @edit="() => {}"
  />
</template>
```
