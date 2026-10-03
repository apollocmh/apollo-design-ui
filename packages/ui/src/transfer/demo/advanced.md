---
order: 3
title:
  zh-CN: 高级用法
  en-US: Advanced
---

受控 `selectedKeys` + `render` 自定义条目渲染的完整交互。

```vue
<script setup lang="ts">
// 对齐 antd `advanced.tsx`。
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 15 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  chosen: i % 2 === 0,
}));

const selectedKeys = ref<string[]>([]);
const targetKeys = ref<string[]>(
  mockData.filter((item) => item.chosen).map((item) => item.key),
);
</script>

<template>
  <Transfer
    :data-source="mockData"
    :target-keys="targetKeys"
    :selected-keys="selectedKeys"
    :render="(item) => item.title"
    @change="targetKeys = $event"
    @select-change="(s, t) => (selectedKeys = [...s, ...t])"
  />
</template>
```
