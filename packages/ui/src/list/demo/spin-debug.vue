<script setup lang="ts">
// 对齐 antd 的 `spin-debug` demo。
import { List, ListItem } from '@apollo-design/ui';
import { h } from 'vue';

const data = ['content', 'content', 'content'];
const renderItem = (item: unknown) => h(ListItem, null, { default: () => String(item) });
</script>

<template>
  <List loading :data-source="data" :render-item="renderItem" />
</template>
