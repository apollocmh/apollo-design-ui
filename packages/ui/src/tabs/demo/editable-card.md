---
order: 7
title:
  zh-CN: 可增删
  en-US: Editable card
---

`type="editable-card"`：`@edit` 的载荷是**改写过的**（add 传事件、remove 传 key）。

```vue
<script setup lang="ts">
// 对齐 antd `editable-card.tsx`。⚠️ 载荷改写规则与 antd 一致：
// `@edit="(target, action) => …"` —— action 是 `'add' | 'remove'`；
// add 时 target 是**事件对象**，remove 时 target 是 **key**。
import { Tabs } from '@apollo-design/ui';
import { ref } from 'vue';

const items = ref([
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
]);
const activeKey = ref('1');

const onEdit = (target: unknown, action: 'add' | 'remove'): void => {
  if (action === 'remove') {
    items.value = items.value.filter((item) => item.key !== target);
    return;
  }
  const next = String(items.value.length + 1);
  items.value = [...items.value, { key: next, label: `Tab ${next}`, children: `Content ${next}` }];
  activeKey.value = next;
};
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Tabs v-model:active-key="activeKey" type="editable-card" :items="items" @edit="onEdit" />
    <Tabs type="editable-card" hide-add :items="items" @edit="onEdit" />
  </div>
</template>
```
