<script setup lang="ts">
// 对齐 antd 的 `grid` demo。
import { Card, List, ListItem } from '@apollo-design/ui';

const data = Array.from({ length: 6 }).map((_, i) => ({ title: `Title ${i + 1}` }));
</script>

<template>
  <List :grid="{ gutter: 16, column: 3 }" :data-source="data">
    <template #item="{ item }">
      <ListItem><Card :title="item.title">Card content</Card></ListItem>
    </template>
  </List>
</template>
