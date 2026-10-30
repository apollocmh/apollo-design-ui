<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

/**
 * ⭐ 单元格合并靠列的 `onCell`：返回 `{ colSpan }` 跨列、`{ rowSpan }` 跨行。
 * 被跨掉的格子要返回 `{ colSpan: 0 }` / `{ rowSpan: 0 }`，否则后面的列会整体错位。
 */
const sharedOnCell = (_record: Record<string, unknown>, rowIndex: number) => {
  if (rowIndex === 1) return { colSpan: 0 };
  if (rowIndex === 3) return { rowSpan: 2 };
  if (rowIndex === 4) return { rowSpan: 0 };
  return {};
};

const columns: TableColumnsType = [
  {
    title: 'Name',
    dataIndex: 'name',
    onCell: (_r: unknown, index: number) => ({
      rowSpan: index === 0 ? 3 : index === 3 ? 2 : 0,
    }),
  },
  { title: 'Age', dataIndex: 'age' },
  { title: 'Home phone', dataIndex: 'tel', onCell: sharedOnCell },
  { title: 'Phone', dataIndex: 'phone' },
  { title: 'Address', dataIndex: 'address' },
];

const data: Record<string, unknown>[] = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    tel: '0571-22098909',
    phone: 18889898989,
    address: 'New York No. 1 Lake Park',
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 42,
    tel: '0571-22098333',
    phone: 18889898888,
    address: 'London No. 1 Lake Park',
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    tel: '0575-22098909',
    phone: 18900010002,
    address: 'Sydney No. 1 Lake Park',
  },
  {
    key: '4',
    name: 'Jim Red',
    age: 18,
    tel: '0575-22098909',
    phone: 18900010002,
    address: 'London No. 2 Lake Park',
  },
  {
    key: '5',
    name: 'Jake White',
    age: 18,
    tel: '0575-22098909',
    phone: 18900010002,
    address: 'Dublin No. 2 Lake Park',
  },
];
</script>

<template>
  <Table :columns="columns" :data-source="data" bordered :pagination="false" />
</template>
