<script setup lang="ts">
import type { TableColumnsType, TableKey, TableRowSelection } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';
import { computed, ref } from 'vue';

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

const selectedRowKeys = ref<TableKey[]>([]);
const rowSelection = computed<TableRowSelection>(() => ({
  type: 'radio',
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: TableKey[]) => {
    selectedRowKeys.value = keys;
  },
}));
</script>

<template>
  <Table :columns="columns" :data-source="data" :row-selection="rowSelection" />
</template>
