<script setup lang="ts">
// 对齐 antd 的 `grid` demo。
import { Card, List, ListItem } from '@apollo-design/ui';
import { h } from 'vue';

const data = Array.from({ length: 6 }).map((_, i) => ({ title: `Title ${i + 1}` }));

const renderItem = (item: unknown) => {
  // ⚠️ 参数必须收 `unknown`（函数参数**逆变**）
  const { title } = item as { title: string };
  return h(
    ListItem,
    { key: title },
    {
      default: () => h(Card, { title }, { default: () => 'Card content' }),
    },
  );
};
</script>

<template>
  <List :grid="{ gutter: 16, column: 3 }" :data-source="data" :render-item="renderItem" />
</template>
