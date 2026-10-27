<script setup lang="ts">
// 对齐 antd 的 `rich` 用法：头像、标题、标签与操作按钮组成富内容列表项。
import { Avatar, Button, Listy, Tag, Text } from '@apollo-design/ui';
import { ref } from 'vue';

const items = ref([
  {
    key: 1,
    name: 'Olivia',
    role: 'Product designer',
    tags: ['Design', 'Vue'],
    followed: true,
  },
  {
    key: 2,
    name: 'Liam',
    role: 'Frontend engineer',
    tags: ['TypeScript', 'Ant Design'],
    followed: false,
  },
  {
    key: 3,
    name: 'Emma',
    role: 'Design systems',
    tags: ['Tokens', 'Accessibility'],
    followed: false,
  },
  {
    key: 4,
    name: 'Noah',
    role: 'Data visualization',
    tags: ['Charts', 'SVG'],
    followed: true,
  },
]);

const toggleFollow = (item: (typeof items.value)[number]) => {
  item.followed = !item.followed;
};
</script>

<template>
  <Listy :items="items" row-key="key" :height="300">
    <template #default="{ item }">
      <div style="display: flex; align-items: center; gap: 12px; width: 100%">
        <Avatar style="background-color: #1677ff; color: #000">{{ item.name.slice(0, 1) }}</Avatar>
        <div style="flex: 1; min-width: 0">
          <Text strong>{{ item.name }}</Text>
          <div><Text type="secondary" style="font-size: 12px">{{ item.role }}</Text></div>
          <Tag v-for="tag in item.tags" :key="tag" color="blue">{{ tag }}</Tag>
        </div>
        <Button
          size="small"
          :type="item.followed ? 'default' : 'primary'"
          @click="toggleFollow(item)"
        >
          {{ item.followed ? '已关注' : '关注' }}
        </Button>
      </div>
    </template>
  </Listy>
</template>
