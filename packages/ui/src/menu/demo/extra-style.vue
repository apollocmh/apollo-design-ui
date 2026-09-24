<script setup lang="ts">
// 对齐 antd demo/extra-style.tsx（items 的 extra 字段：右侧附加内容）

import type { ItemType } from '@apollo-design/ui';
import { Menu } from '@apollo-design/ui';
import { h, ref } from 'vue';

const current = ref<string[]>(['1']);

const items: ItemType[] = [
  { key: '1', label: 'Option 1', extra: '⌘P' },
  { key: '2', label: 'Option 2', extra: '⌘B' },
];
</script>

<template>
  <Menu v-model:selectedKeys="current" mode="inline" :items="items" style="width: 256px" />
</template>
