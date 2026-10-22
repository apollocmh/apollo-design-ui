<script setup lang="ts">
// 对齐 antd 6.6.4 demo/horizontal.tsx：
// - 顶层只有 item / submenu / link，**没有** type:'group'（group 放在 SubMenu.children 内）
// - Navigation Two 禁用；Navigation Four 是链接

import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@apollo-design/icons';
import type { ItemType } from '@apollo-design/ui';
import { Menu } from '@apollo-design/ui';
import { h, ref } from 'vue';

const current = ref<string[]>(['mail']);
const items: ItemType[] = [
  { key: 'mail', label: 'Navigation One', icon: h(MailOutlined) },
  { key: 'app', label: 'Navigation Two', icon: h(AppstoreOutlined), disabled: true },
  {
    key: 'SubMenu',
    label: 'Navigation Three - Submenu',
    icon: h(SettingOutlined),
    children: [
      {
        type: 'group',
        label: 'Item 1',
        children: [
          { key: 'setting:1', label: 'Option 1' },
          { key: 'setting:2', label: 'Option 2' },
        ],
      },
      {
        type: 'group',
        label: 'Item 2',
        children: [
          { key: 'setting:3', label: 'Option 3' },
          { key: 'setting:4', label: 'Option 4' },
        ],
      },
    ],
  },
  {
    key: 'alipay',
    label: h(
      'a',
      { href: 'https://ant.design', target: '_blank', rel: 'noopener noreferrer' },
      'Navigation Four - Link',
    ),
  },
];

const handleClick = (info: { key: string }) => {
  current.value = [info.key];
};
</script>

<template>
  <Menu v-model:selectedKeys="current" mode="horizontal" :items="items" @click="handleClick" />
</template>
