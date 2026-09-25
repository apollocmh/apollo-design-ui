<script setup lang="ts">
// 对齐 antd demo/selectable.tsx
import { Dropdown } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
];
</script>

<template>
  <Dropdown :menu="{ items, selectable: true, defaultSelectedKeys: ['1'] }">
    <a class="cursor-pointer" @click.prevent>
      Hover me
    </a>
  </Dropdown>
</template>
