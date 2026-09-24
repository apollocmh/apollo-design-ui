<script setup lang="ts">
// 对齐 antd demo/sider-current.tsx（Layout.Sider 联动 —— v1 用 Sider 的
// collapsed(collapsed: boolean) 事件驱动 inlineCollapsed）

import { AppstoreOutlined, MailOutlined } from '@apollo-design/icons';
import type { ItemType } from '@apollo-design/ui';
import { Layout, Menu } from '@apollo-design/ui';
import { h, ref } from 'vue';

const { Sider } = Layout;
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
];
</script>

<template>
  <div style="height: 200px">
    <Sider
      collapsible
      :collapsed="collapsed"
      @collapse="(c: boolean) => (collapsed = c)"
    >
      <Menu
        v-model:selectedKeys="current"
        v-model:openKeys="openKeys"
        mode="inline"
        :inline-collapsed="collapsed"
        :items="items"
      />
    </Sider>
  </div>
</template>
