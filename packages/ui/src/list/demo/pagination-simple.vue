<script setup lang="ts">
// Simple pagination with native total content.
import type { PaginationConfig } from '@apollo-design/ui';
import { List, ListItem, Text } from '@apollo-design/ui';

const data = Array.from({ length: 23 }, (_, i) => `Item ${i + 1}`);

const pagination: PaginationConfig = {
  pageSize: 5,
  simple: true,
};
</script>

<template>
  <div>
    <Text type="secondary">`simple` 分页可输入页码，切换后列表切片同步更新。</Text>
    <List :data-source="data" :pagination="pagination" style="margin-top: 12px">
      <template #paginationTotal="{ total, range }">{{ range[0] }}-{{ range[1] }} / {{ total }}</template>
      <template #item="{ item }"><ListItem>{{ item }}</ListItem></template>
    </List>
  </div>
</template>
