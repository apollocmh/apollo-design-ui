<script setup lang="ts">
// 对齐 antd 的 `component-token` demo：通过 ConfigProvider 覆盖 List 的 Component Token。
import { Avatar, Button, ConfigProvider, List, ListItem, ListItemMeta } from '@apollo-design/ui';
import { ref } from 'vue';

const themed = ref(true);

const data = Array.from({ length: 3 }, (_, i) => ({
  title: `Ant Design Title ${i + 1}`,
  description: 'Ant Design, a design language for background applications.',
}));
</script>

<template>
  <Button style="margin-bottom: 12px" @click="themed = !themed">切换 List 主题</Button>
  <ConfigProvider
    :theme="themed ? {
      components: {
        List: {
          itemPadding: '20px 24px',
          itemPaddingLG: '24px 24px',
          headerBg: '#e6f4ff',
          footerBg: '#fffbe6',
          descriptionFontSize: 16,
        },
      },
    } : undefined"
  >
    <List
      bordered
      size="large"
      :data-source="data"
    >
      <template #header><span :style="themed ? { color: '#1f1f1f' } : undefined">Component token header</span></template>
      <template #footer><span :style="themed ? { color: '#1f1f1f' } : undefined">Component token footer</span></template>
      <template #item="{ item }">
        <ListItem>
          <ListItemMeta :title="item.title" :description="item.description">
            <template #avatar><Avatar style="background-color: #1677ff; color: #000">{{ item.title.slice(0, 1) }}</Avatar></template>
          </ListItemMeta>
        </ListItem>
      </template>
    </List>
  </ConfigProvider>
</template>
