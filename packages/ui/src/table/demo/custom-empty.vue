<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Age', dataIndex: 'age' },
  { title: 'Address', dataIndex: 'address' },
];
</script>

<template>
  <Table :columns="columns" :data-source="[]" bordered>
    <template #emptyText><div style="padding:24px;text-align:center"><div style="font-size:32px">🗂️</div><div style="margin-top:8px;color:rgba(0,0,0,0.45)">暂无数据</div></div></template>
  </Table>
</template>
