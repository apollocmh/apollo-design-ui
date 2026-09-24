<script setup lang="ts">
// 对齐 antd demo/style-class.tsx（semantic classNames/styles 对象形态）

import type { ItemType } from '@apollo-design/ui';
import { Menu } from '@apollo-design/ui';
import { h, ref } from 'vue';

const current = ref<string[]>(['1']);

const items: ItemType[] = [
  { key: '1', label: 'Option 1' },
  { key: '2', label: 'Option 2' },
];

const styles = {
  item: { borderRadius: '8px' },
  itemContent: { fontWeight: 600 },
};
</script>

<template>
  <Menu
    v-model:selectedKeys="current"
    mode="inline"
    :items="items"
    :styles="styles"
    style="width: 256px"
  />
</template>
