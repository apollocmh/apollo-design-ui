<script setup lang="ts">
// 对齐 antd `extra.tsx`。
import { Button, Tabs } from '@apollo-design/ui';
import { h } from 'vue';

const items = [
  { key: '1', label: 'Tab 1', children: 'Content of Tab Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Content of Tab Pane 2' },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Tabs
      default-active-key="1"
      :items="items"
      :tab-bar-extra-content="h(Button, null, () => 'Right extra action')"
    />
    <Tabs
      default-active-key="1"
      :items="items"
      :tab-bar-extra-content="{ left: h('span', 'Left extra action'), right: h(Button, null, () => 'Right extra action') }"
    />
  </div>
</template>
