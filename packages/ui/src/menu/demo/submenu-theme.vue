<script setup lang="ts">
// 对齐 antd 6.6.4 demo/submenu-theme.tsx：
// vertical 菜单 + Switch 切换**子菜单独立主题**（items[].theme），
// 并用 getPopupContainer 把弹层挂在触发元素的父节点内。

import { MailOutlined } from '@apollo-design/icons';
import type { ItemType, MenuTheme } from '@apollo-design/ui';
import { Menu, Switch } from '@apollo-design/ui';
import { computed, h, ref } from 'vue';

const menuTheme = ref<MenuTheme>('light');
const current = ref<string[]>(['1']);
const dark = computed({
  get: () => menuTheme.value === 'dark',
  set: (value: boolean) => {
    menuTheme.value = value ? 'dark' : 'light';
  },
});

const items = computed<ItemType[]>(() => [
  {
    key: 'sub1',
    icon: h(MailOutlined),
    label: 'Navigation One',
    theme: menuTheme.value,
    children: [
      { key: '1', label: 'Option 1' },
      { key: '2', label: 'Option 2' },
      { key: '3', label: 'Option 3' },
    ],
  },
  { key: '5', label: 'Option 5' },
  { key: '6', label: 'Option 6' },
]);

const getPopupContainer = (node: HTMLElement): HTMLElement =>
  (node.parentNode as HTMLElement | null) ?? document.body;
</script>

<template>
  <Switch v-model:checked="dark" checked-children="Dark" un-checked-children="Light" />
  <br />
  <br />
  <Menu
    v-model:selectedKeys="current"
    :open-keys="['sub1']"
    :items="items"
    mode="vertical"
    theme="dark"
    :get-popup-container="getPopupContainer"
    style="width: 256px"
  />
</template>
