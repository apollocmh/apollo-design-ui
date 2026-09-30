<script setup lang="ts">
// 对齐 antd `placement.tsx`。
import { Tabs } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Tabs default-active-key="1" tab-placement="top" :items="items" />
    <Tabs default-active-key="1" tab-placement="bottom" :items="items" />
    <Tabs default-active-key="1" tab-placement="start" :items="items" />
    <Tabs default-active-key="1" tab-placement="end" :items="items" />
  </div>
</template>
