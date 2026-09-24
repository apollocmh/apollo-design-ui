<script setup lang="ts">
// 对齐 antd demo/component-token.tsx。
// ⚠️ ConfigProvider 的 components.Menu token 覆盖不支持（D25/D83）⇒
//    以默认 token 渲染（结构一致；token 公式由 L7 的 prepareComponentToken 对拍）。

import type { ItemType } from '@apollo-design/ui';
import { Menu } from '@apollo-design/ui';
import { h, ref } from 'vue';

const current = ref<string[]>(['1']);

const items: ItemType[] = [
  { key: '1', label: 'Option 1' },
  { key: '2', label: 'Option 2' },
];
</script>

<template>
  <Menu v-model:selectedKeys="current" mode="inline" :items="items" style="width: 256px" />
</template>
