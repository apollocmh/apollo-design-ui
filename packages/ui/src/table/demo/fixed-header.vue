<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', width: 150 },
  { title: 'Age', dataIndex: 'age', width: 80 },
  { title: 'Address', dataIndex: 'address' },
];

const data: Record<string, unknown>[] = [];
for (let i = 0; i < 20; i += 1) {
  data.push({
    key: String(i),
    name: `Edward King ${i}`,
    age: 32,
    address: `London, Park Lane no. ${i}`,
  });
}
</script>

<template>
  <!-- ⭐ scroll.y 给表体一个固定高度 ⇒ 表头吸顶、表体独立滚动 -->
  <Table :columns="columns" :data-source="data" :scroll="{ y: 240 }" :pagination="false" />
</template>
