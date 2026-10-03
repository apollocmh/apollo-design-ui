<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';
import { h } from 'vue';

const columns: TableColumnsType = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: ({ text }: { text: unknown }) => h('a', String(text)),
  },
  { title: 'Age', dataIndex: 'age', key: 'age' },
  { title: 'Address', dataIndex: 'address', key: 'address' },
];

const data: Record<string, unknown>[] = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 28, address: 'Sydney No. 1 Lake Park' },
];
</script>

<template>
  <Table :columns="columns" :data-source="data" />
</template>
