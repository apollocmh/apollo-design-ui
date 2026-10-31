<script setup lang="ts">
// 对齐 antd 的 group + sticky 用法
import { Listy } from '@apollo-design/ui';

const items = Array.from({ length: 12 }, (_, i) => ({
  key: i,
  group: `Group ${i % 3}`,
  content: `Item ${i}`,
}));

const group = {
  key: (item: (typeof items)[number]) => item.group,
};
</script>

<template>
  <Listy :items="items" row-key="key" :group="group" sticky :height="280">
    <template #groupHeader="{ groupKey, items: groupItems }">{{ groupKey }} ({{ groupItems.length }})</template>
    <template #default="{ item }">{{ item.content }}</template>
  </Listy>
</template>
