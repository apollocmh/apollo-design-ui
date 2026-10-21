<script setup lang="ts">
import type { TableColumnsType, TableExpandableConfig, TableKey } from '@apollo-design/ui';
import { Button, Space, Table, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

interface TreeRow {
  [key: string]: unknown;
  key: string;
  name: string;
  role: string;
  subRows?: TreeRow[];
}

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Role', dataIndex: 'role', key: 'role' },
];

const data: TreeRow[] = [
  {
    key: '1',
    name: 'Engineering',
    role: '部门',
    subRows: [
      { key: '1-1', name: 'Alice', role: '前端工程师' },
      { key: '1-2', name: 'Bob', role: '后端工程师' },
    ],
  },
  {
    key: '2',
    name: 'Design',
    role: '部门',
    subRows: [
      { key: '2-1', name: 'Carol', role: '视觉设计师' },
      { key: '2-2', name: 'David', role: '交互设计师' },
    ],
  },
];

const allKeys: TableKey[] = ['1', '2'];
const expandedRowKeys = ref<TableKey[]>(['1']);

const expandable = computed<TableExpandableConfig>(() => ({
  expandedRowKeys: expandedRowKeys.value,
  onExpandedRowsChange: (keys: TableKey[]) => {
    expandedRowKeys.value = keys;
  },
}));

function expandAll(): void {
  expandedRowKeys.value = [...allKeys];
}

function collapseAll(): void {
  expandedRowKeys.value = [];
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <Button type="primary" @click="expandAll">全部展开</Button>
      <Button @click="collapseAll">全部收起</Button>
      <Tag color="blue">已展开 {{ expandedRowKeys.length }} 个节点</Tag>
    </Space>

    <Table
      :columns="columns"
      :data-source="data"
      children-column-name="subRows"
      :expandable="expandable"
      :pagination="false"
    />
  </div>
</template>
