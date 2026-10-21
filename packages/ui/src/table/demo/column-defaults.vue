<script setup lang="ts">
import type { TableColumnInterface, TableColumnsType } from '@apollo-design/ui';
import { Select, Space, Table, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

type Align = 'left' | 'center' | 'right';

const align = ref<Align>('center');

const alignOptions: { value: Align; label: string }[] = [
  { value: 'left', label: 'left' },
  { value: 'center', label: 'center' },
  { value: 'right', label: 'right' },
];

const columns: TableColumnsType = [
  {
    title: 'Name（显式左对齐）',
    dataIndex: 'name',
    key: 'name',
    // 列自身配置优先于 column 提供的公共默认值
    align: 'left',
  },
  { title: 'Age', dataIndex: 'age', key: 'age' },
  { title: 'City', dataIndex: 'city', key: 'city' },
];

const data = [
  { key: '1', name: 'John Brown', age: 32, city: 'New York' },
  { key: '2', name: 'Jim Green', age: 42, city: 'London' },
  { key: '3', name: 'Joe Black', age: 28, city: 'Sydney' },
  { key: '4', name: 'Jim Red', age: 32, city: 'London' },
];

/** `column` 提供所有列的公共默认值；列自身的 align 会覆盖它。 */
const defaultColumn = computed<Partial<TableColumnInterface>>(() => ({
  align: align.value,
}));

function onAlignChange(value: unknown): void {
  align.value = value as Align;
}
</script>

<template>
  <div>
    <Space :size="12" style="margin-bottom: 16px">
      <span>column.align</span>
      <Select
        aria-label="列对齐方式"
        :value="align"
        :options="alignOptions"
        style="width: 120px"
        @change="onAlignChange"
      />
      <Tag color="blue">{{ align }}</Tag>
      <Tag>Name 列显式 align="left"</Tag>
    </Space>

    <Table :columns="columns" :data-source="data" :column="defaultColumn" />
  </div>
</template>
