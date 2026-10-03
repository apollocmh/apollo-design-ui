---
order: 2
title:
  zh-CN: 单向
  en-US: One way
---

`oneWay` 单向模式：隐藏「向左」按钮，右列改为删除按钮。

```vue
<script setup lang="ts">
// 对齐 antd `oneway.tsx`。
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  disabled: i % 4 === 0,
}));

const targetKeys = ref<string[]>(['2', '4']);
</script>

<template>
  <Transfer :data-source="mockData" one-way :target-keys="targetKeys" @change="targetKeys = $event" />
</template>
```
