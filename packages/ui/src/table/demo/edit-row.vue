<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Button, Input, InputNumber, Select, Space, Table, Tag } from '@apollo-design/ui';
import { h, ref } from 'vue';

type Department = 'engineering' | 'design' | 'marketing';

interface EditableRow {
  [key: string]: unknown;
  key: string;
  name: string;
  age: number;
  department: Department;
}

interface DraftRow {
  name: string;
  age: number;
  department: Department;
}

const departmentOptions: { value: Department; label: string }[] = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
];

const createRows = (): EditableRow[] => [
  { key: '1', name: 'John Brown', age: 32, department: 'engineering' },
  { key: '2', name: 'Jim Green', age: 42, department: 'design' },
  { key: '3', name: 'Joe Black', age: 28, department: 'marketing' },
];

const data = ref<EditableRow[]>(createRows());
const editingKey = ref<string | null>(null);
const draft = ref<DraftRow>({ name: '', age: 30, department: 'engineering' });
const lastAction = ref('尚未编辑');

function startEdit(record: EditableRow): void {
  editingKey.value = record.key;
  draft.value = {
    name: record.name,
    age: record.age,
    department: record.department,
  };
  lastAction.value = `正在编辑第 ${record.key} 行`;
}

function cancelEdit(): void {
  editingKey.value = null;
  lastAction.value = '已取消编辑';
}

function saveEdit(): void {
  const key = editingKey.value;
  if (!key) return;
  const record = data.value.find((item) => item.key === key);
  if (!record) return;
  const name = draft.value.name.trim();
  record.name = name || record.name;
  record.age = draft.value.age;
  record.department = draft.value.department;
  editingKey.value = null;
  lastAction.value = `第 ${key} 行已保存：${record.name} / ${record.age} / ${record.department}`;
}

function resetRows(): void {
  data.value = createRows();
  editingKey.value = null;
  lastAction.value = '已重置数据';
}

const columns: TableColumnsType = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    width: 190,
    render: (_value: unknown, record: Record<string, unknown>) => {
      const row = record as unknown as EditableRow;
      if (editingKey.value !== row.key) return row.name;
      return h(Input, {
        size: 'small',
        value: draft.value.name,
        'aria-label': `第 ${row.key} 行姓名`,
        'onUpdate:value': (value: string) => {
          draft.value.name = value;
        },
      });
    },
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    width: 110,
    render: (_value: unknown, record: Record<string, unknown>) => {
      const row = record as unknown as EditableRow;
      if (editingKey.value !== row.key) return row.age;
      return h(InputNumber, {
        size: 'small',
        min: 1,
        max: 120,
        value: draft.value.age,
        'aria-label': `第 ${row.key} 行年龄`,
        style: { width: '86px' },
        'onUpdate:value': (value: string | number | null) => {
          if (value !== null) draft.value.age = Number(value);
        },
      });
    },
  },
  {
    title: 'Department',
    dataIndex: 'department',
    key: 'department',
    width: 180,
    render: (_value: unknown, record: Record<string, unknown>) => {
      const row = record as unknown as EditableRow;
      if (editingKey.value !== row.key) return row.department;
      return h(Select, {
        size: 'small',
        value: draft.value.department,
        options: departmentOptions,
        'aria-label': `第 ${row.key} 行部门`,
        style: { width: '150px' },
        'onUpdate:value': (value: unknown) => {
          draft.value.department = value as Department;
        },
      });
    },
  },
  {
    title: 'Action',
    key: 'action',
    width: 170,
    render: (_value: unknown, record: Record<string, unknown>) => {
      const row = record as unknown as EditableRow;
      if (editingKey.value !== row.key) {
        return h(
          Button,
          { type: 'link', size: 'small', onClick: () => startEdit(row) },
          { default: () => '编辑本行' },
        );
      }
      return h(
        Space,
        { size: 8 },
        {
          default: () => [
            h(
              Button,
              { type: 'primary', size: 'small', onClick: saveEdit },
              { default: () => '保存' },
            ),
            h(Button, { size: 'small', onClick: cancelEdit }, { default: () => '取消' }),
          ],
        },
      );
    },
  },
];
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <Button @click="resetRows">重置数据</Button>
      <Tag :color="editingKey ? 'blue' : 'default'">
        {{ editingKey ? `编辑中：第 ${editingKey} 行` : '当前没有行处于编辑态' }}
      </Tag>
      <span>{{ lastAction }}</span>
    </Space>

    <Table :columns="columns" :data-source="data" :pagination="false" />
  </div>
</template>
