<script setup lang="ts">
// 对齐 antd demo/dropdown-button.tsx
import { DropdownButton } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
  { key: '3', label: '3rd item' },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px; align-items: flex-start">
    <DropdownButton :menu="{ items }">
      Dropdown
    </DropdownButton>
    <DropdownButton :menu="{ items }" placement="top">
      Dropdown
    </DropdownButton>
    <DropdownButton :menu="{ items }" disabled>
      Dropdown
    </DropdownButton>
    <DropdownButton :menu="{ items }" :trigger="['click']">
      Dropdown
    </DropdownButton>
    <DropdownButton :menu="{ items }" split>
      Dropdown
    </DropdownButton>
  </div>
</template>
