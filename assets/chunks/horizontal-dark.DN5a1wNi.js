const e=`<script setup lang="ts">
// 对齐 antd demo/horizontal-dark.tsx（暗色水平菜单）

import { AppstoreOutlined, MailOutlined } from '@apollo-design/icons';
import type { ItemType } from '@apollo-design/ui';
import { Menu } from '@apollo-design/ui';
import { h, ref } from 'vue';

const current = ref<string[]>(['mail']);
const items: ItemType[] = [
  { key: 'mail', label: 'Navigation One', icon: h(MailOutlined) },
  { key: 'app', label: 'Navigation Two', icon: h(AppstoreOutlined) },
];
<\/script>

<template>
  <Menu v-model:selectedKeys="current" mode="horizontal" theme="dark" :items="items" />
</template>
`;export{e as default};
