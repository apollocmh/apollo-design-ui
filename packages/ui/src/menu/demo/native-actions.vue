<script setup lang="ts">
import { type ItemType, Menu, type MenuInfo } from '@apollo-design/ui';
import { h, ref, useId } from 'vue';

const target = useId();
const actions = ref(0);
const selected = ref<string[]>([]);
const lastEvent = ref('');
const items: ItemType[] = [
  { key: 'link', label: h('a', { href: `#${target}` }, '原生链接 / Native link') },
  {
    key: 'button',
    label: h(
      'button',
      { type: 'button', onClick: () => actions.value++ },
      '原生按钮 / Native button',
    ),
  },
  {
    key: 'disabled',
    disabled: true,
    label: h('a', { href: '#disabled-menu-action' }, '禁用链接 / Disabled link'),
  },
  { key: 'plain', label: '普通菜单项 / Plain item' },
];
const record = (info: MenuInfo) => {
  lastEvent.value = `${info.key}: ${info.domEvent.type}`;
};
</script>

<template>
  <Menu v-model:selectedKeys="selected" :items="items" aria-label="Native menu actions" @click="record" />
  <p :id="target" role="status">Actions: {{ actions }} · {{ lastEvent }}</p>
</template>
