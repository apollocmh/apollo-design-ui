const n=`<script setup lang="ts">
// 对齐 antd demo/horizontal.tsx（水平菜单 + 受控 selectedKeys）

import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@apollo-design/icons';
import type { ItemType } from '@apollo-design/ui';
import { Menu } from '@apollo-design/ui';
import { h, ref } from 'vue';

const current = ref<string[]>(['mail']);
const items: ItemType[] = [
  { key: 'mail', label: 'Navigation One', icon: h(MailOutlined) },
  { key: 'app', label: 'Navigation Two', icon: h(AppstoreOutlined) },
  {
    key: 'sub',
    label: 'Navigation Three - Submenu',
    icon: h(SettingOutlined),
    children: [
      { key: '5', label: 'Option 5' },
      { key: '6', label: 'Option 6' },
      {
        key: 'sub3',
        label: 'Submenu',
        children: [
          { key: '7', label: 'Option 7' },
          { key: '8', label: 'Option 8' },
        ],
      },
    ],
  },
  {
    key: 'grp',
    label: 'Navigation Four - Group',
    type: 'group',
    children: [
      { key: '9', label: 'Item 9' },
      { key: '10', label: 'Item 10' },
    ],
  },
];

const handleClick = (info: { key: string }) => {
  current.value = [info.key];
};
<\/script>

<template>
  <Menu v-model:selectedKeys="current" mode="horizontal" :items="items" @click="handleClick" />
</template>
`;export{n as default};
