<script setup lang="ts">
// 对齐 antd 的 `pagination` demo。
import { List, ListItem } from '@apollo-design/ui';

const data = Array.from({ length: 12 }).map((_, i) => `item ${i + 1}`);
</script>

<template>
  <List :pagination="{ pageSize: 3, position: 'both' }" :data-source="data">
    <template #item="{ item }"><ListItem>{{ item }}</ListItem></template>
  </List>
</template>
