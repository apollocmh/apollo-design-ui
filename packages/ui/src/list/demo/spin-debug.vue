<script setup lang="ts">
// 对齐 antd 的 `spin-debug` demo。
import { List, ListItem } from '@apollo-design/ui';

const data = ['content', 'content', 'content'];
</script>

<template>
  <List loading :data-source="data">
    <template #item="{ item }"><ListItem>{{ item }}</ListItem></template>
  </List>
</template>
