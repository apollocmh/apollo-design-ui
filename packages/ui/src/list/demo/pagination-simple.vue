<script setup lang="ts">
// 对齐 antd 的 `pagination` demo 变体：simple 分页 + showTotal。
import type { ListProps, PaginationConfig } from '@apollo-design/ui';
import { List, ListItem, Text } from '@apollo-design/ui';
import { h } from 'vue';

const data = Array.from({ length: 23 }, (_, i) => `Item ${i + 1}`);

const renderItem: ListProps['renderItem'] = (item) =>
  h(ListItem, null, { default: () => String(item) });

const pagination: PaginationConfig = {
  pageSize: 5,
  simple: true,
  showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
};
</script>

<template>
  <div>
    <Text type="secondary">`simple` 分页可输入页码，切换后列表切片同步更新。</Text>
    <List
      :data-source="data"
      :render-item="renderItem"
      :pagination="pagination"
      style="margin-top: 12px"
    />
  </div>
</template>
