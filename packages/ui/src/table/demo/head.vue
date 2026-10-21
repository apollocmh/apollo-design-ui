<script setup lang="ts">
import type { TableColumnsType, TableProps } from '@apollo-design/ui';
import { Button, Space, Table, Tag } from '@apollo-design/ui';
import { h, ref } from 'vue';

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

const renderTitle = (rows: Record<string, unknown>[]) =>
  h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      },
    },
    [
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        h('strong', null, '用户列表'),
        h(Tag, { color: 'blue' }, () => `${rows.length} 行`),
      ]),
      h(
        Space,
        { size: 12 },
        {
          default: () => [
            h(
              Button,
              { size: 'small', onClick: refresh },
              { default: () => `刷新（${refreshCount.value}）` },
            ),
            h(Tag, { color: showFilters.value ? 'green' : 'default' }, () =>
              showFilters.value ? '已刷新' : '待刷新',
            ),
          ],
        },
      ),
    ],
  );

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
      :title="renderTitle"
      footer="表头与底部均由 Table 的语义槽渲染"
      @change="onTableChange"
    />
  </div>
</template>
