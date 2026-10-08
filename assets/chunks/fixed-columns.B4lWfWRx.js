const e=`<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 120, fixed: 'left' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 100 },
  { title: 'Column 1', dataIndex: 'address', key: 'address1', width: 150 },
  { title: 'Column 2', dataIndex: 'address', key: 'address2', width: 150 },
  { title: 'Column 3', dataIndex: 'address', key: 'address3', width: 150 },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 120, fixed: 'right' },
];

const data = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
];
<\/script>

<template>
  <Table :columns="columns" :data-source="data" :scroll="{ x: 790 }" style="width: 480px" />
</template>
`;export{e as default};
