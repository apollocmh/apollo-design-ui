<script setup lang="ts">
// 对齐 antd demo/extra.tsx
import { Button, Dropdown } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item', extra: '⌘P' },
  { key: '2', label: '2nd menu item', extra: '⌘N' },
];
</script>

<template>
  <Dropdown :menu="{ items }">
    <Button type="link">
      Hover me
    </Button>
  </Dropdown>
</template>
