<script setup lang="ts">
// 对齐 antd demo/event.tsx
import { Dropdown } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
  { key: '3', label: '3rd menu item' },
];

const onClick = ({ key }: { key: string | number }) => {
  console.log(`Click on item ${key}`);
};
</script>

<template>
  <Dropdown :menu="{ items, onClick: onClick as never }">
    <a class="cursor-pointer" @click.prevent>
      Hover me
    </a>
  </Dropdown>
</template>
