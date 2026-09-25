<script setup lang="ts">
// 对齐 antd demo/menu-full.tsx（menu 的完整 props 通道）
import { Dropdown } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item', danger: true },
  { type: 'divider' as const },
  { key: '3', label: '3rd menu item', disabled: true },
];
</script>

<template>
  <Dropdown :menu="{ items, selectable: true, onClick: (i: unknown) => console.log(i) }">
    <a class="cursor-pointer" @click.prevent>
      Hover me
    </a>
  </Dropdown>
</template>
