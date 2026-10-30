<script setup lang="ts">
// 对齐 antd demo/style-class.tsx（classNames/styles 语义槽）
import { Button, ConfigProvider, Dropdown } from '@apollo-design/ui';
import { ref } from 'vue';

const custom = ref(true);

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
];
</script>

<template>
  <ConfigProvider :theme="custom ? { components: { Dropdown: { paddingBlock: 9, zIndexPopup: 1500 } } } : undefined">
    <Button @click="custom = !custom">Change menu spacing</Button>
    <Dropdown
    :menu="{ items }"
    :class-names="{ root: 'my-root' }"
    :styles="{ root: { minWidth: '200px' }, itemContent: { letterSpacing: '1px' } }"
    :trigger="['click']"
  >
      <Button>Open styled actions</Button>
    </Dropdown>
  </ConfigProvider>
</template>
