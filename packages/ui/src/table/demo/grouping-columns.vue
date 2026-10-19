<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

// ⭐ 列的 `children` 即多级表头：有 children 的列不渲染单元格，只做分组
const columns: TableColumnsType = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: 100,
    fixed: 'left',
    filters: [
      { text: 'John', value: 'John' },
      { text: 'Joe', value: 'Joe' },
    ],
    onFilter: (value: unknown, record: Record<string, unknown>) =>
      (record.name as string).includes(value as string),
  },
  {
    title: 'Other',
    children: [
      { title: 'Age', dataIndex: 'age', key: 'age', width: 150, sorter: true },
      {
        title: 'Address',
        children: [
          { title: 'Street', dataIndex: 'street', key: 'street', width: 150 },
          {
            title: 'Block',
            children: [
              { title: 'Building', dataIndex: 'building', key: 'building', width: 100 },
              { title: 'Door No.', dataIndex: 'number', key: 'number', width: 100 },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Company',
    children: [
      { title: 'Company Address', dataIndex: 'companyAddress', key: 'companyAddress' },
      { title: 'Company Name', dataIndex: 'companyName', key: 'companyName' },
    ],
  },
  { title: 'Gender', dataIndex: 'gender', key: 'gender', width: 80, fixed: 'right' },
];

const data: Record<string, unknown>[] = [];
for (let i = 0; i < 10; i += 1) {
  data.push({
    key: String(i),
    name: i % 2 === 0 ? 'John Brown' : 'Joe Black',
    age: i + 20,
    street: 'Lake Park',
    building: 'C',
    number: 2035,
    companyAddress: 'Lake Street 42',
    companyName: 'SoftLake Co',
    gender: 'M',
  });
}
</script>

<template>
  <Table
    :columns="columns"
    :data-source="data"
    :scroll="{ x: 'max-content' }"
    bordered
    :pagination="false"
  />
</template>
