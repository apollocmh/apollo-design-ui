<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Summary, Table, TableSummaryCell, TableSummaryRow } from '@apollo-design/ui';

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
</script>

<template>
  <Table :columns="columns" :data-source="data" bordered>
    <template #summary>
      <Summary>
        <TableSummaryRow>
          <TableSummaryCell :index="0" :col-span="2">Total</TableSummaryCell>
          <TableSummaryCell :index="2">{{ total }}</TableSummaryCell>
        </TableSummaryRow>
      </Summary>
    </template>
  </Table>
</template>
