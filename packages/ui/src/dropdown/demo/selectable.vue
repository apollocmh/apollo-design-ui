<script setup lang="ts">
// 对齐 antd demo/selectable.tsx
import { Button, Dropdown } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
];
</script>

<template>
  <Dropdown :menu="{ items, selectable: true, defaultSelectedKeys: ['1'] }">
    <Button type="link">
      Hover me
    </Button>
  </Dropdown>
</template>
