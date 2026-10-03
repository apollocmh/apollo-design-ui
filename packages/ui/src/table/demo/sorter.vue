<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name' },
  {
    title: 'Age',
    dataIndex: 'age',
    defaultSortOrder: 'descend',
    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
      (a.age as number) - (b.age as number),
  },
];

const data = [
  { key: '1', name: 'John Brown', age: 32 },
  { key: '2', name: 'Jim Green', age: 42 },
  { key: '3', name: 'Joe Black', age: 28 },
];

const onChange = (_pagination: unknown, _filters: unknown, sorter: unknown) => {
  console.log('sorter params:', sorter);
};
</script>

<template>
  <Table :columns="columns" :data-source="data" @change="onChange" />
</template>
