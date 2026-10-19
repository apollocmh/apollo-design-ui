<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';
import { h } from 'vue';

const columns: TableColumnsType = [
  { title: 'Full Name', dataIndex: 'name', width: 150 },
  { title: 'Age', dataIndex: 'age', width: 80 },
  { title: 'Column 1', dataIndex: 'address', width: 200 },
  { title: 'Column 2', dataIndex: 'address', width: 200 },
  { title: 'Column 3', dataIndex: 'address', width: 200 },
  {
    title: 'Action',
    key: 'action',
    width: 120,
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
  <!-- ⭐ sticky：表格随页面滚动时，表头吸在容器顶部（这里是窗口顶部偏移 0） -->
  <Table
    :columns="columns"
    :data-source="data"
    :scroll="{ x: 1300 }"
    sticky
    :pagination="false"
  />
</template>
