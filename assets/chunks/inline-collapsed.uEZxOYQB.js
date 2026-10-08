const n=`<script setup lang="ts">
// 对齐 antd demo/inline-collapsed.tsx（折叠态：图标条 + Tooltip 标题）

import {
  AccountBookOutlined,
  AppstoreOutlined,
  ContainerOutlined,
  MailOutlined,
} from '@apollo-design/icons';
import type { ItemType } from '@apollo-design/ui';
import { Button, Menu } from '@apollo-design/ui';
import { h, ref } from 'vue';

const collapsed = ref(false);
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
  {
    key: 'sub2',
    label: 'Navigation Two',
    icon: h(AppstoreOutlined),
    children: [
      { key: '3', label: 'Option 3' },
      { key: '4', label: 'Option 4' },
    ],
  },
  {
    key: 'sub3',
    label: 'Navigation Three',
    icon: h(ContainerOutlined),
    children: [
      { key: '5', label: 'Option 5' },
      { key: '6', label: 'Option 6' },
    ],
  },
  {
    key: 'sub4',
    label: 'Navigation Four',
    icon: h(AccountBookOutlined),
    children: [
      { key: '7', label: 'Option 7' },
      { key: '8', label: 'Option 8' },
    ],
  },
];
<\/script>

<template>
  <div style="width: 256px">
    <Button type="primary" style="margin-bottom: 16px" @click="collapsed = !collapsed">
      {{ collapsed ? 'Expand' : 'Collapse' }}
    </Button>
    <Menu
      v-model:selectedKeys="current"
      v-model:openKeys="openKeys"
      mode="inline"
      :inline-collapsed="collapsed"
      :items="items"
    />
  </div>
</template>
`;export{n as default};
