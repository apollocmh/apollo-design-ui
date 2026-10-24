<script setup lang="ts">
// 对齐 antd 的 `responsive` demo。
import { Card, List, ListItem } from '@apollo-design/ui';

const data = Array.from({ length: 8 }).map((_, i) => ({ title: `Title ${i + 1}` }));
</script>

<template>
  <List :grid="{ gutter: 16, xs: 1, sm: 2, md: 4, lg: 4, xl: 6, xxl: 3 }" :data-source="data">
    <template #item="{ item }">
      <ListItem><Card :title="item.title">Card content</Card></ListItem>
    </template>
  </List>
</template>
