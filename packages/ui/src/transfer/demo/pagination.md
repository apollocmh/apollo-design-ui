---
order: 4
title:
  zh-CN: 分页
  en-US: Pagination
---

`pagination` 开启列表面板内嵌分页（面板自动加宽，头部下拉多出「选择当前页」）。

```vue
<script setup lang="ts">
// 对齐 antd `pagination.tsx`。
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 40 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  disabled: i % 4 === 0,
}));

const targetKeys = ref<string[]>(
  mockData.filter((item) => Number(item.key) % 3 > 1).map((item) => item.key),
);
</script>

<template>
  <Transfer
    :data-source="mockData"
    :pagination="{ pageSize: 10 }"
    :target-keys="targetKeys"
    @change="targetKeys = $event"
  />
</template>
```
