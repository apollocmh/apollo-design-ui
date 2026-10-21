<script setup lang="ts">
import type { TableColumnsType, TableKey, TableRowSelection } from '@apollo-design/ui';
import { Button, Space, Table, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

interface RowData {
  [key: string]: unknown;
  key: string;
  name: string;
  age: number;
  role: string;
}

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 100 },
  { title: 'Role', dataIndex: 'role', key: 'role' },
];

const data: RowData[] = [
  { key: '1', name: 'John Brown', age: 32, role: 'Engineer' },
  { key: '2', name: 'Jim Green', age: 42, role: 'Designer' },
  { key: '3', name: 'Joe Black', age: 28, role: 'Manager' },
  { key: '4', name: 'Disabled User', age: 40, role: 'Guest' },
  { key: '5', name: 'Jim Red', age: 33, role: 'Engineer' },
];

const selectedRowKeys = ref<TableKey[]>([]);
const lastAction = ref('尚未选择');

const selectedNames = computed(() =>
  data.filter((row) => selectedRowKeys.value.includes(row.key)).map((row) => row.name),
);

const rowSelection = computed<TableRowSelection>(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: TableKey[], _rows: Record<string, unknown>[], info) => {
    selectedRowKeys.value = keys;
    lastAction.value = `选择方式：${info.type}`;
  },
  getCheckboxProps: (record: Record<string, unknown>) => ({
    disabled: record.name === 'Disabled User',
  }),
  selections: [
    {
      key: 'all',
      text: '全选所有行',
      onSelect: () => {
        selectedRowKeys.value = data
          .filter((row) => row.name !== 'Disabled User')
          .map((row) => row.key);
        lastAction.value = '自定义项：全选所有行';
      },
    },
    {
      key: 'clear',
      text: '清空选择',
      onSelect: () => {
        selectedRowKeys.value = [];
        lastAction.value = '自定义项：清空选择';
      },
    },
    {
      key: 'even',
      text: '仅选择偶数年龄',
      onSelect: () => {
        selectedRowKeys.value = data
          .filter((row) => row.age % 2 === 0 && row.name !== 'Disabled User')
          .map((row) => row.key);
        lastAction.value = '自定义项：仅选择偶数年龄';
      },
    },
  ],
}));

function clearSelection(): void {
  selectedRowKeys.value = [];
  lastAction.value = '已从页面按钮清空选择';
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <Button :disabled="!selectedRowKeys.length" @click="clearSelection">清空选择</Button>
      <Tag color="blue">{{ lastAction }}</Tag>
      <Tag>
        {{ selectedNames.length ? `已选：${selectedNames.join('、')}` : '当前未选择任何行' }}
      </Tag>
    </Space>

    <Table
      :columns="columns"
      :data-source="data"
      :row-selection="rowSelection"
      :pagination="false"
    />
  </div>
</template>
