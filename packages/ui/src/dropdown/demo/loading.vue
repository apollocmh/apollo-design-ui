<script setup lang="ts">
// 对齐 antd demo/loading.tsx
import { Button, Dropdown } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
];
</script>

<template>
  <Dropdown :menu="{ items }">
    <Button loading>
      Loading
    </Button>
  </Dropdown>
</template>
