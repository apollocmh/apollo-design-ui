const e=`<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';
import { h } from 'vue';

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Age', dataIndex: 'age' },
  { title: 'Address', dataIndex: 'address' },
];

const data = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 28, address: 'Sydney No. 1 Lake Park' },
];

const total = data.reduce((acc, d) => acc + d.age, 0);
const renderSummary = () =>
  h(Table.Summary, null, {
    default: () =>
      h(Table.Summary.Row, null, {
        default: () => [
          h(Table.Summary.Cell, { index: 0, colSpan: 2 }, { default: () => 'Total' }),
          h(Table.Summary.Cell, { index: 2 }, { default: () => String(total) }),
        ],
      }),
  });
<\/script>

<template>
  <Table :columns="columns" :data-source="data" :summary="renderSummary" bordered />
</template>
`;export{e as default};
