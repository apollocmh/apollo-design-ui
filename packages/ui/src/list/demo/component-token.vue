<script setup lang="ts">
// 对齐 antd 的 `component-token` demo：通过 ConfigProvider 覆盖 List 的 Component Token。
import { Avatar, ConfigProvider, List, ListItem, ListItemMeta } from '@apollo-design/ui';
import { h } from 'vue';

const data = Array.from({ length: 3 }, (_, i) => ({
  title: `Ant Design Title ${i + 1}`,
  description: 'Ant Design, a design language for background applications.',
}));
</script>

<template>
  <ConfigProvider
    :theme="{
      components: {
        List: {
          itemPadding: '20px 24px',
          itemPaddingLG: '24px 24px',
          headerBg: '#e6f4ff',
          footerBg: '#fffbe6',
          descriptionFontSize: 16,
        },
      },
    }"
  >
    <List
      bordered
      size="large"
      header="Component token header"
      footer="Component token footer"
      :data-source="data"
    >
      <template #item="{ item }">
        <ListItem>
          <ListItemMeta
            :avatar="h(Avatar, { style: { backgroundColor: '#1677ff' } }, () => item.title.slice(0, 1))"
            :title="item.title"
            :description="item.description"
          />
        </ListItem>
      </template>
    </List>
  </ConfigProvider>
</template>
