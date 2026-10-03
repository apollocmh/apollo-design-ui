---
order: 1
title:
  zh-CN: 搜索
  en-US: Search
---

`showSearch` 开启搜索框，按条目文本过滤两个列表。

```vue
<script setup lang="ts">
// 对齐 antd `search.tsx`。
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  description: `description of content${i + 1}`,
}));

const targetKeys = ref<string[]>(
  mockData.filter((item) => Number(item.key) % 3 > 1).map((item) => item.key),
);
</script>

<template>
  <Transfer :data-source="mockData" show-search :target-keys="targetKeys" @change="targetKeys = $event" />
</template>
```
