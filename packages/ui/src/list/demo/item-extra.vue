<script setup lang="ts">
// 对齐 antd 的 `itemLayout` / `extra` 用法：横向布局下 extra 位于右侧。
import { LikeOutlined } from '@apollo-design/icons';
import { Avatar, Button, List, ListItem, ListItemMeta, Text } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const articles = ref([
  {
    title: 'Ant Design Title 1',
    description: 'Ant Design, a design language for background applications.',
    likes: 12,
  },
  {
    title: 'Ant Design Title 2',
    description: 'We supply a series of design principles and practical patterns.',
    likes: 8,
  },
  {
    title: 'Ant Design Title 3',
    description: 'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet.',
    likes: 21,
  },
]);

const totalLikes = computed(() => articles.value.reduce((sum, item) => sum + item.likes, 0));
</script>

<template>
  <div>
    <Text>
      横向 `itemLayout` 的 `extra` 位于右侧；点击 Like 会即时更新，当前总点赞：{{ totalLikes }}
    </Text>
    <List :data-source="articles" style="margin-top: 12px">
      <template #extra><Text>列表总点赞：{{ totalLikes }}</Text></template>
      <template #item="{ item: article }">
        <ListItem>
          <ListItemMeta :title="article.title" :description="article.description">
            <template #avatar>
              <Avatar style="background-color: #1677ff">{{ article.title.slice(0, 1) }}</Avatar>
            </template>
          </ListItemMeta>
          <template #extra>
            <span style="display: inline-block; width: 120px; height: 64px; border-radius: 8px; background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)" />
          </template>
          <template #actions>
            <Button type="link" size="small" @click="article.likes += 1"><LikeOutlined /> {{ article.likes }}</Button>
          </template>
        </ListItem>
      </template>
    </List>
  </div>
</template>
