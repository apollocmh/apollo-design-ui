const e=`<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Age', dataIndex: 'age' },
  { title: 'Address', dataIndex: 'address' },
];

const data = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
];
<\/script>

<template>
  <Table bordered :columns="columns" :data-source="data" />
</template>
`;export{e as default};
