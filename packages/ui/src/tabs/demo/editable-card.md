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
let nextKey = 3;

// ⚠️ 第二个形参的类型必须是 **`string`**（与 `Tabs` 的 emits 声明 `(_target, _action: string)`
//    一致）—— 写成 `'add' | 'remove'` 会因「参数逆变」被判为不可赋值（`string` 不能赋给
//    那个更窄的联合）。收窄发生在**函数体内**，不在签名上。
const onEdit = (target: unknown, action: string): void => {
  if (action === 'remove') {
    const index = items.value.findIndex((item) => item.key === target);
    items.value = items.value.filter((item) => item.key !== target);
    if (activeKey.value === target)
      activeKey.value = items.value[Math.max(0, index - 1)]?.key ?? '';
    return;
  }
  const next = String(nextKey++);
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
