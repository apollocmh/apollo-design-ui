<script setup lang="ts">
// 对齐 antd `card.tsx`。
import { Tabs } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Tabs default-active-key="1" type="card" :items="items" />
    <Tabs default-active-key="1" type="card" :tab-bar-gutter="36" :items="items" />
  </div>
</template>
