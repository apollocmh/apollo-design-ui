<script setup lang="ts">
// 对齐 antd 的 `basic` demo。
import { List, ListItem, ListItemMeta } from '@apollo-design/ui';

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
            <span style="display: inline-block; width: 32px; height: 32px; background: #999; border-radius: 50%" />
          </template>
          <template #title><a href="#title">{{ item.title }}</a></template>
        </ListItemMeta>
      </ListItem>
    </template>
  </List>
</template>
