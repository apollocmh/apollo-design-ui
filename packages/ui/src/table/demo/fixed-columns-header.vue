<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';
import { h } from 'vue';

const columns: TableColumnsType = [
  { title: 'Full Name', dataIndex: 'name', width: 150, fixed: 'left' },
  { title: 'Age', dataIndex: 'age', width: 100, fixed: 'left' },
  { title: 'Column 1', dataIndex: 'address', width: 200 },
  { title: 'Column 2', dataIndex: 'address', width: 200 },
  { title: 'Column 3', dataIndex: 'address', width: 200 },
  { title: 'Column 4', dataIndex: 'address', width: 200 },
  { title: 'Column 5', dataIndex: 'address', width: 200 },
  { title: 'Column 6', dataIndex: 'address', width: 200 },
  {
    title: 'Action',
    key: 'action',
    width: 120,
    fixed: 'right',
    render: () => h('a', 'action'),
  },
];

const data: Record<string, unknown>[] = [];
for (let i = 0; i < 20; i += 1) {
  data.push({
    key: String(i),
    name: `Edward ${i}`,
    age: 32,
    address: `London Park no. ${i}`,
  });
}
</script>

<template>
  <!-- ⭐ 同时给 x 与 y：横向固定列吸边、纵向表头吸顶 -->
  <Table
    :columns="columns"
    :data-source="data"
    :scroll="{ x: 1500, y: 240 }"
    :pagination="false"
  />
</template>
