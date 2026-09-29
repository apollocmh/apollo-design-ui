---
order: 0
title:
  zh-CN: 基本
  en-US: Basic
---

最简单的用法：`v-model:current` 绑定当前页。

```vue
<script setup lang="ts">
// 对齐 antd `basic.tsx`。
import { Pagination } from '@apollo-design/ui';
import { ref } from 'vue';

const current = ref(1);
</script>

<template>
  <Pagination v-model:current="current" :total="50" />
</template>
```
