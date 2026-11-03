<script setup lang="ts">
// 对齐 antd 的 `basic` demo。
import { Avatar, List, ListItem, ListItemMeta } from '@apollo-design/ui';

const data = [
  { title: 'Ant Design Title 1' },
  { title: 'Ant Design Title 2' },
  { title: 'Ant Design Title 3' },
  { title: 'Ant Design Title 4' },
];
</script>

<template>
  <List item-layout="horizontal" :data-source="data">
    <template #item="{ item }">
      <ListItem>
        <ListItemMeta description="Ant Design, a design language for background applications.">
          <template #avatar>
            <Avatar>{{ item.title.slice(-1) }}</Avatar>
          </template>
          <template #title><a href="#demo-basic">{{ item.title }}</a></template>
        </ListItemMeta>
      </ListItem>
    </template>
  </List>
</template>
