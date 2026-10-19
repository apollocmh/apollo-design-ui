<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

// ⭐ ellipsis 需要配合固定列宽：宽度不定时浏览器无从判断「超出」
const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', width: 120, ellipsis: true },
  { title: 'Age', dataIndex: 'age', width: 80, align: 'center' },
  {
    title: 'Address',
    dataIndex: 'address',
    width: 260,
    ellipsis: true,
  },
];

const data: Record<string, unknown>[] = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park, New York No. 1 Lake Park, New York No. 1 Lake Park',
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 42,
    address: 'London No. 1 Lake Park, London No. 1 Lake Park, London No. 1 Lake Park',
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 28,
    address: 'Sydney No. 1 Lake Park, Sydney No. 1 Lake Park, Sydney No. 1 Lake Park',
  },
];
</script>

<template>
  <Table :columns="columns" :data-source="data" :pagination="false" />
</template>
