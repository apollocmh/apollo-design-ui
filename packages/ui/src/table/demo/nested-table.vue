<script setup lang="ts">
import type { TableColumnsType, TableExpandableConfig, TableKey } from '@apollo-design/ui';
import { Button, Space, Table, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

interface OuterRow {
  key: string;
  name: string;
  department: string;
  email: string;
}

const columns: TableColumnsType<OuterRow> = [
  { title: 'Customer', dataIndex: 'name', key: 'name' },
  { title: 'Department', dataIndex: 'department', key: 'department', width: 160 },
  { title: 'Email', dataIndex: 'email', key: 'email' },
];

const data: OuterRow[] = [
  {
    key: '1',
    name: 'Alice',
    department: 'Engineering',
    email: 'alice@example.com',
  },
  {
    key: '2',
    name: 'Bob',
    department: 'Design',
    email: 'bob@example.com',
  },
  {
    key: '3',
    name: 'Carol',
    department: 'Marketing',
    email: 'carol@example.com',
  },
];

const innerColumns: TableColumnsType = [
  { title: 'Order', dataIndex: 'order', key: 'order', width: 140 },
  { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 120, align: 'right' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
];

const innerData: Record<string, Record<string, unknown>[]> = {
  '1': [
    { key: '1-1', order: 'SO-1001', amount: 1280, status: 'Paid' },
    { key: '1-2', order: 'SO-1002', amount: 560, status: 'Pending' },
  ],
  '2': [
    { key: '2-1', order: 'SO-1003', amount: 890, status: 'Paid' },
    { key: '2-2', order: 'SO-1004', amount: 2400, status: 'Shipped' },
  ],
  '3': [{ key: '3-1', order: 'SO-1005', amount: 430, status: 'Refunded' }],
};

const allKeys = data.map((item) => item.key);
const expandedRowKeys = ref<TableKey[]>(['1', '2']);

const expandable = computed<TableExpandableConfig<OuterRow>>(() => ({
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
      <Button type="primary" @click="expandAll">展开全部客户</Button>
      <Button @click="collapseAll">收起全部</Button>
      <Tag color="blue">已展开 {{ expandedRowKeys.length }} 行</Tag>
    </Space>

    <Table
      :columns="columns"
      :data-source="data"
      :pagination="false"
      :expandable="expandable"
      bordered
    >
      <template #expandedRow="{record}"><div style="padding:12px 0 4px"><div style="font-weight:600;margin-bottom:8px">最近订单 · {{record.name}}</div><Table :columns="innerColumns" :data-source="innerData[record.key]??[]" :pagination="false" size="small" /></div></template>
    </Table>
  </div>
</template>
