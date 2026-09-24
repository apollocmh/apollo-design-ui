<script setup lang="ts">
// 对齐 antd demo/submenu-theme.tsx（子菜单主题独立：dark 菜单里 light 子菜单）

import { MailOutlined } from '@apollo-design/icons';
import type { ItemType } from '@apollo-design/ui';
import { Menu } from '@apollo-design/ui';
import { h, ref } from 'vue';

const current = ref<string[]>(['1']);
const openKeys = ref<string[]>(['sub1']);

const items: ItemType[] = [
  {
    key: 'sub1',
    label: 'Navigation One',
    icon: h(MailOutlined),
    children: [
      { key: '1', label: 'Option 1' },
      { key: '2', label: 'Option 2' },
    ],
  },
];
</script>

<template>
  <Menu
    v-model:selectedKeys="current"
    v-model:openKeys="openKeys"
    mode="inline"
    theme="dark"
    :items="items"
    style="width: 256px"
  />
</template>
