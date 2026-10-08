const n=`<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

interface DataType {
  key: string;
  name: string;
  age: number;
  children?: DataType[];
}

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age' },
];

const data = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    children: [
      { key: '1-1', name: 'Jim Green', age: 40 },
      {
        key: '1-2',
        name: 'Joe Black',
        age: 36,
        children: [{ key: '1-2-1', name: 'Jim Red', age: 32 }],
      },
    ],
  },
  { key: '2', name: 'Johnny Green', age: 28 },
];
<\/script>

<template>
  <Table :columns="columns" :data-source="data" />
</template>
`;export{n as default};
