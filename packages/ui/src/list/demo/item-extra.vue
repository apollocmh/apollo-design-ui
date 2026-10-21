<script setup lang="ts">
// 对齐 antd 的 `itemLayout` / `extra` 用法：横向布局下 extra 位于右侧。
import { LikeOutlined } from '@apollo-design/icons';
import type { ListProps } from '@apollo-design/ui';
import { Avatar, Button, List, ListItem, ListItemMeta, Text } from '@apollo-design/ui';
import { computed, h, ref } from 'vue';

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

const renderItem: ListProps['renderItem'] = (item) => {
  const article = item as (typeof articles.value)[number];
  return h(
    ListItem,
    {
      extra: h('span', {
        style: {
          display: 'inline-block',
          width: '120px',
          height: '64px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
        },
      }),
      actions: [
        h(
          Button,
          {
            type: 'link',
            size: 'small',
            onClick: () => {
              article.likes += 1;
            },
          },
          () => [h(LikeOutlined), ` ${article.likes}`],
        ),
      ],
    },
    {
      default: () =>
        h(ListItemMeta, {
          avatar: h(Avatar, { style: { backgroundColor: '#1677ff' } }, () =>
            article.title.slice(0, 1),
          ),
          title: article.title,
          description: article.description,
        }),
    },
  );
};
</script>

<template>
  <div>
    <Text>
      横向 `itemLayout` 的 `extra` 位于右侧；点击 Like 会即时更新，当前总点赞：{{ totalLikes }}
    </Text>
    <List :data-source="articles" :render-item="renderItem" style="margin-top: 12px" />
  </div>
</template>
