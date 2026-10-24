---
order: 5
title:
  zh-CN: 自定义渲染条目
  en-US: Custom item
---

`#item` 渲染条目，`#footer` 展示面板统计。搜索匹配数据 `title`；自定义搜索使用 `filterOption`。

```vue
<script setup lang="ts">
// 对齐 antd `custom-item.tsx`。
import type { TransferKey } from '@apollo-design/ui';
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  chosen: i % 2 === 0,
}));

const targetKeys = ref<string[]>(mockData.filter((item) => item.chosen).map((item) => item.key));
</script>

<template>
  <Transfer
    :data-source="mockData"
    :target-keys="targetKeys"
    @change="targetKeys = $event.map(String)"
  >
    <template #item="{ item, selected, disabled }">
      <span :aria-disabled="disabled">{{ item.title }}（key: {{ item.key }}）{{ selected ? ' ✓' : '' }}</span>
    </template>
    <template #footer="{ direction, selectedKeys, totalCount }">
      {{ direction === 'left' ? '来源' : '目标' }}：{{ selectedKeys.length }}/{{ totalCount }}
    </template>
  </Transfer>
</template>
```
