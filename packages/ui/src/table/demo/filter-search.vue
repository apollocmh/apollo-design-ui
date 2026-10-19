<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

const columns: TableColumnsType = [
  {
    title: 'Name',
    dataIndex: 'name',
    // ⭐ 项多时给个搜索框；`filterSearch: true` 直接按 value 过滤
    filters: [
      { text: 'Joe', value: 'Joe' },
      { text: 'John', value: 'John' },
      { text: 'Jim', value: 'Jim' },
    ],
    filterSearch: true,
    onFilter: (value: unknown, record: Record<string, unknown>) =>
      (record.name as string).includes(value as string),
  },
  {
    title: 'Address',
    dataIndex: 'address',
    filters: [
      { text: 'London', value: 'London' },
      { text: 'New York', value: 'New York' },
      { text: 'Sydney', value: 'Sydney' },
    ],
    // 函数形态：自定义匹配字段（这里按城市名前缀匹配）
    filterSearch: (input: string, record: { value?: unknown; text?: unknown }) =>
      String(record.value ?? '')
        .toLowerCase()
        .includes(input.toLowerCase()),
    onFilter: (value: unknown, record: Record<string, unknown>) =>
      (record.address as string).includes(value as string),
  },
];

const data = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 28, address: 'Sydney No. 1 Lake Park' },
  { key: '4', name: 'Jim Red', age: 32, address: 'London No. 2 Lake Park' },
];
</script>

<template>
  <Table :columns="columns" :data-source="data" />
</template>
