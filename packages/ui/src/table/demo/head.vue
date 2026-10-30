<script setup lang="ts">
import type { TableColumnsType, TableProps } from '@apollo-design/ui';
import { Button, Space, Table, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const refreshCount = ref(0);
const lastAction = ref('等待操作');
const showFilters = ref(false);

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    width: 100,
    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
      (a.age as number) - (b.age as number),
  },
  {
    title: 'Role',
    dataIndex: 'role',
    key: 'role',
    filters: [
      { text: 'Engineer', value: 'engineer' },
      { text: 'Designer', value: 'designer' },
      { text: 'Manager', value: 'manager' },
    ],
    onFilter: (value: unknown, record: Record<string, unknown>) => record.role === value,
  },
];

const data = [
  { key: '1', name: 'John Brown', age: 32, role: 'engineer' },
  { key: '2', name: 'Jim Green', age: 42, role: 'designer' },
  { key: '3', name: 'Joe Black', age: 28, role: 'manager' },
  { key: '4', name: 'Jim Red', age: 32, role: 'engineer' },
  { key: '5', name: 'Alice White', age: 36, role: 'designer' },
];

function refresh(): void {
  refreshCount.value += 1;
  showFilters.value = true;
  lastAction.value = `第 ${refreshCount.value} 次刷新：头部按钮与表格联动`;
}

const onTableChange: TableProps['onChange'] = (_pagination, _filters, sorter) => {
  const field = (sorter as { field?: string }).field;
  lastAction.value = field ? `排序字段：${field}` : '排序已清除';
};
</script>

<template>
  <div>
    <div style="margin-bottom: 16px">
      <Tag color="blue">{{ lastAction }}</Tag>
    </div>

    <Table
      :columns="columns"
      :data-source="data"
      :pagination="false"
      @change="onTableChange"
    >
      <template #title="{data:rows}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:8px"><strong>用户列表</strong><Tag color="blue">{{rows.length}} 行</Tag></div>
          <Space :size="12"><Button size="small" @click="refresh">刷新（{{refreshCount}}）</Button><Tag :color="showFilters?'green':'default'">{{showFilters?'已刷新':'待刷新'}}</Tag></Space>
        </div>
      </template>
      <template #footer>表头与底部均由 Table 的原生插槽渲染</template>
    </Table>
  </div>
</template>
