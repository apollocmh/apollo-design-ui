<script setup lang="ts">
// 对齐 antd demo/style-class.tsx（classNames/styles 语义槽）
import { Dropdown } from '@apollo-design/ui';

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
];
</script>

<template>
  <Dropdown
    :menu="{ items }"
    :class-names="{ root: 'my-root' }"
    :styles="{ root: { minWidth: '200px' } }"
  >
    <a class="cursor-pointer" @click.prevent>
      Hover me
    </a>
  </Dropdown>
</template>
