<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Button, Input, InputNumber, Space, Table, Tag } from '@apollo-design/ui';
import { h, ref } from 'vue';

interface EditableRow {
  [key: string]: unknown;
  key: string;
  name: string;
  age: number;
  role: string;
}

const createRows = (): EditableRow[] => [
  { key: '1', name: 'John Brown', age: 32, role: '前端工程师' },
  { key: '2', name: 'Jim Green', age: 42, role: '后端工程师' },
  { key: '3', name: 'Joe Black', age: 28, role: '设计师' },
];

const data = ref<EditableRow[]>(createRows());
const editCount = ref(0);
const lastEdit = ref('尚未编辑');

function updateField(row: EditableRow, field: 'name' | 'age', value: string | number): void {
  if (field === 'age') {
    const nextAge = Number(value);
    if (!Number.isFinite(nextAge)) return;
    row.age = nextAge;
  } else {
    row.name = String(value);
  }
  editCount.value += 1;
  lastEdit.value = `${row.name} 的 ${field} 更新为 ${String(value)}`;
}

const columns: TableColumnsType = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: (_value: unknown, record: Record<string, unknown>) =>
      h(Input, {
        size: 'small',
        'aria-label': `姓名（第 ${String(record.key)} 行）`,
        value: record.name as string,
        'onUpdate:value': (value: string) =>
          updateField(record as unknown as EditableRow, 'name', value),
      }),
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    width: 120,
    render: (_value: unknown, record: Record<string, unknown>) =>
      h(InputNumber, {
        size: 'small',
        'aria-label': `年龄（第 ${String(record.key)} 行）`,
        value: record.age as number,
        min: 1,
        max: 120,
        style: { width: '88px' },
        'onUpdate:value': (value: string | number | null) => {
          if (value !== null) updateField(record as unknown as EditableRow, 'age', value);
        },
      }),
  },
  { title: 'Role', dataIndex: 'role', key: 'role' },
];

function resetRows(): void {
  data.value = createRows();
  editCount.value = 0;
  lastEdit.value = '已重置，尚未编辑';
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <Button @click="resetRows">重置数据</Button>
      <Tag color="blue">编辑次数：{{ editCount }}</Tag>
      <Tag>{{ lastEdit }}</Tag>
    </Space>

    <Table :columns="columns" :data-source="data" :pagination="false" />
  </div>
</template>
