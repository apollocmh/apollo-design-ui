<script setup lang="ts">
// 对齐 antd 的 `empty` 用法：dataSource 为空时用 locale.emptyText 自定义空态。
import type { ListLocale } from '@apollo-design/ui';
import { Empty, List, ListItem, Switch, Text } from '@apollo-design/ui';
import { computed, h, ref } from 'vue';

const showData = ref(false);

const data = computed(() => (showData.value ? ['Ant Design', 'Apollo Design', 'Vue 3'] : []));

const locale = computed<ListLocale>(() => ({
  emptyText: h(Empty, {
    description: showData.value ? 'No data' : '打开开关加载数据',
  }),
}));
</script>

<template>
  <div>
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px">
      <Text>显示数据</Text>
      <Switch v-model:checked="showData" />
    </div>
    <List :data-source="data" :locale="locale">
      <template #item="{ item }"><ListItem>{{ item }}</ListItem></template>
    </List>
  </div>
</template>
