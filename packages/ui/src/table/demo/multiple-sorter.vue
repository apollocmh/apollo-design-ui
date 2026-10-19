<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';

interface RecordType {
  // ⚠️ 必须显式写索引签名：见 ajax.vue 同名注释（interface 没有隐式索引签名）。
  [key: string]: unknown;
  key: string;
  name: string;
  chinese: number;
  math: number;
  english: number;
}

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name' },
  {
    title: 'Chinese Score',
    dataIndex: 'chinese',
    // ⭐ `multiple` 是排序权重：数字越小优先级越高
    sorter: {
      compare: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (a.chinese as number) - (b.chinese as number),
      multiple: 3,
    },
  },
  {
    title: 'Math Score',
    dataIndex: 'math',
    sorter: {
      compare: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (a.math as number) - (b.math as number),
      multiple: 2,
    },
  },
  {
    title: 'English Score',
    dataIndex: 'english',
    sorter: {
      compare: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (a.english as number) - (b.english as number),
      multiple: 1,
    },
  },
];

const data: RecordType[] = [
  { key: '1', name: 'John Brown', chinese: 98, math: 60, english: 70 },
  { key: '2', name: 'Jim Green', chinese: 98, math: 66, english: 89 },
  { key: '3', name: 'Joe Black', chinese: 98, math: 90, english: 70 },
  { key: '4', name: 'Jim Red', chinese: 88, math: 99, english: 89 },
];

const onChange = (_pagination: unknown, _filters: unknown, sorter: unknown) => {
  console.log('sorter params:', sorter);
};
</script>

<template>
  <Table :columns="columns" :data-source="data" @change="onChange" />
</template>
