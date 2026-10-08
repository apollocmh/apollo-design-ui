const n=`<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

const columns: TableColumnsType = [
  {
    title: 'Name',
    dataIndex: 'name',
    filters: [
      { text: 'Joe', value: 'Joe' },
      { text: 'John', value: 'John' },
    ],
    onFilter: (value: unknown, record: Record<string, unknown>) =>
      (record.name as string).includes(value as string),
  },
  {
    title: 'Age',
    dataIndex: 'age',
    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
      (a.age as number) - (b.age as number),
  },
  { title: 'Address', dataIndex: 'address' },
];

const data = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 28, address: 'Sydney No. 1 Lake Park' },
];

const onChange = (
  _pagination: unknown,
  filters: unknown,
  _sorter: unknown,
  { currentDataSource }: { currentDataSource: unknown[] },
) => {
  console.log('filters:', filters, 'data:', currentDataSource);
};
<\/script>

<template>
  <Table :columns="columns" :data-source="data" @change="onChange" />
</template>
`;export{n as default};
