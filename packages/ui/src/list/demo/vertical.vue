<script setup lang="ts">
// 对齐 antd 的 `vertical` demo。
import { List, ListItem, ListItemMeta, Space } from '@apollo-design/ui';

const data = Array.from({ length: 6 }).map((_, i) => ({
  href: '#title',
  title: `ant design part ${i}`,
  description: 'Ant Design, a design language for background applications.',
  content:
    'We supply a series of design principles, practical patterns and high quality design resources.',
}));
</script>

<template>
  <List
    item-layout="vertical"
    size="large"
    :pagination="{ pageSize: 3 }"
    :data-source="data"
  >
    <template #item="{ item }">
      <ListItem>
        <ListItemMeta :description="item.description">
          <template #avatar>
            <span style="display: inline-block; width: 32px; height: 32px; background: #999; border-radius: 50%" />
          </template>
          <template #title><a :href="item.href">{{ item.title }}</a></template>
        </ListItemMeta>
        {{ item.content }}
        <template #actions>
          <Space v-for="(count, index) in ['156', '156', '2']" :key="index">
            <span style="display: inline-block; width: 1em; height: 1em; background: #999" />
            {{ count }}
          </Space>
        </template>
        <template #extra>
          <span style="display: inline-block; width: 272px; height: 120px; background: #eee" />
        </template>
      </ListItem>
    </template>
    <template #footer>
      <div><b>ant design</b> footer part</div>
    </template>
  </List>
</template>
