<script setup lang="ts">
// 对齐 antd `custom-add-trigger.tsx`。
import { PlusCircleOutlined } from '@apollo-design/icons';
import { Tabs, type TabsEditAction, type TabsEditEvent } from '@apollo-design/ui';
import { h, ref } from 'vue';

const items = ref([
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
]);
const activeKey = ref('1');
let nextKey = 3;

function onEdit(target: TabsEditEvent | string, action: TabsEditAction): void {
  if (action === 'add') {
    const key = String(nextKey++);
    items.value.push({ key, label: `Tab ${key}`, children: `Content of Tab Pane ${key}` });
    activeKey.value = key;
    return;
  }
  const index = items.value.findIndex((item) => item.key === target);
  items.value = items.value.filter((item) => item.key !== target);
  if (activeKey.value === target) activeKey.value = items.value[Math.max(0, index - 1)]?.key ?? '';
}
</script>

<template>
  <Tabs
    v-model:active-key="activeKey"
    type="editable-card"
    :items="items"
    :add-icon="h(PlusCircleOutlined)"
    @edit="onEdit"
  />
</template>
