---
order: 0
title:
  zh-CN: 基本
  en-US: Basic
---

最简单的用法：勾选左列条目 → 点击「向右」按钮移动到目标列。

```vue
<script setup lang="ts">
// 对齐 antd `basic.tsx`。
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

interface MockData {
  key: string;
  title: string;
  description: string;
  disabled: boolean;
}

const mockData: MockData[] = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  description: `description of content${i + 1}`,
  disabled: i % 4 === 0,
}));

const targetKeys = ref<string[]>(
  mockData.filter((item) => Number(item.key) % 3 > 1).map((item) => item.key),
);
</script>

<template>
  <Transfer :data-source="mockData" :target-keys="targetKeys" @change="targetKeys = $event" />
</template>
```
