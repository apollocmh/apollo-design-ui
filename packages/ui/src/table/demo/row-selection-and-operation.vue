<script setup lang="ts">
import type { TableColumnsType, TableKey, TableRowSelection } from '@apollo-design/ui';
import { Button, Table } from '@apollo-design/ui';
import { computed, h, ref } from 'vue';

interface RecordType {
  // ⚠️ 必须显式写索引签名：见 ajax.vue 同名注释（interface 没有隐式索引签名）。
  [key: string]: unknown;
  key: string;
  name: string;
  age: number;
  address: string;
}

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Age', dataIndex: 'age' },
  { title: 'Address', dataIndex: 'address' },
  {
    title: 'Action',
    key: 'action',
    render: (_value: unknown, record: Record<string, unknown>) =>
      h('a', { onClick: () => remove(record.key as string) }, 'Delete'),
  },
];

const data = ref<RecordType[]>([
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 28, address: 'Sydney No. 1 Lake Park' },
  { key: '4', name: 'Disabled User', age: 99, address: 'Sydney No. 1 Lake Park' },
]);

const selectedRowKeys = ref<TableKey[]>([]);
const hasSelected = computed(() => selectedRowKeys.value.length > 0);

const rowSelection = computed<TableRowSelection>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: TableKey[]) => {
    selectedRowKeys.value = keys;
  },
  // 第 4 行禁选（antd：`getCheckboxProps` 按行返回勾选框属性）
  getCheckboxProps: (record: Record<string, unknown>) => ({
    disabled: record.name === 'Disabled User',
  }),
}));

function remove(key: string): void {
  data.value = data.value.filter((item) => item.key !== key);
  selectedRowKeys.value = selectedRowKeys.value.filter((k) => k !== key);
}

function batchDelete(): void {
  data.value = data.value.filter((item) => !selectedRowKeys.value.includes(item.key));
  selectedRowKeys.value = [];
}
</script>

<template>
  <div>
    <div style="margin-bottom: 16px">
      <Button type="primary" :disabled="!hasSelected" @click="batchDelete"> 批量删除 </Button>
      <span style="margin-left: 8px">
        {{ hasSelected ? `已选择 ${selectedRowKeys.length} 项` : '未选择' }}
      </span>
    </div>
    <Table :columns="columns" :data-source="data" :row-selection="rowSelection" />
  </div>
</template>
