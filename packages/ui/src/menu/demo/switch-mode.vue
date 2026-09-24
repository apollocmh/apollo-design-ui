<script setup lang="ts">
// 对齐 antd demo/switch-mode.tsx（Switch 切换 mode）

import { AppstoreOutlined, MailOutlined } from '@apollo-design/icons';
import type { ItemType } from '@apollo-design/ui';
import { Menu, Switch } from '@apollo-design/ui';
import { h, ref } from 'vue';

const mode = ref<'inline' | 'vertical'>('inline');
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
  <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px">
    <Switch
      :checked="mode === 'vertical'"
      aria-label="switch mode"
      @change="(checked: boolean | string | number) => (mode = checked ? 'vertical' : 'inline')"
    />
    {{ mode === 'vertical' ? 'vertical' : 'inline' }} menu
  </div>
  <Menu
    v-model:selectedKeys="current"
    v-model:openKeys="openKeys"
    :mode="mode"
    :items="items"
    style="width: 256px"
  />
</template>
