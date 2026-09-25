<script setup lang="ts">
// 对齐 antd demo/sub-menu.tsx
import { Dropdown } from '@apollo-design/ui';

const items = [
  {
    key: '1',
    label: '1st menu item',
    children: [
      { key: '1-1', label: '1st sub menu item' },
      { key: '1-2', label: '2nd sub menu item' },
    ],
  },
  {
    key: '2',
    label: '2nd menu item',
    children: [
      { key: '2-1', label: '1st sub menu item' },
      { key: '2-2', label: '2nd sub menu item' },
    ],
  },
];
</script>

<template>
  <Dropdown :menu="{ items }">
    <a class="cursor-pointer" @click.prevent>
      Hover me
    </a>
  </Dropdown>
</template>
