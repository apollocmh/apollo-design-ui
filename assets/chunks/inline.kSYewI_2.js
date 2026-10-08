const n=`<script setup lang="ts">
// 对齐 antd demo/inline.tsx（内嵌菜单：嵌套 submenu + group）

import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@apollo-design/icons';
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
      { key: '3', label: 'Option 3' },
      { key: '4', label: 'Option 4' },
    ],
  },
  {
    key: 'sub2',
    label: 'Navigation Two',
    icon: h(AppstoreOutlined),
    children: [
      { key: '5', label: 'Option 5' },
      { key: '6', label: 'Option 6' },
      { key: '7', label: 'Option 7' },
      { key: '8', label: 'Option 8' },
    ],
  },
  {
    key: 'sub3',
    label: 'Navigation Three',
    icon: h(SettingOutlined),
    children: [
      { key: '9', label: 'Option 9' },
      { key: '10', label: 'Option 10' },
      { key: '11', label: 'Option 11' },
      { key: '12', label: 'Option 12' },
    ],
  },
];

const handleClick = (info: { key: string }) => {
  current.value = [info.key];
};
<\/script>

<template>
  <Menu
    v-model:selectedKeys="current"
    v-model:openKeys="openKeys"
    mode="inline"
    :items="items"
    @click="handleClick"
  />
</template>
`;export{n as default};
