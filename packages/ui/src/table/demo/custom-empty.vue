<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';
import { h } from 'vue';

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Age', dataIndex: 'age' },
  { title: 'Address', dataIndex: 'address' },
];

// ⭐ emptyText 既可以是 VNode，也可以是返回 VNode 的函数
const renderEmpty = () =>
  h('div', { style: { padding: '24px', textAlign: 'center' } }, [
    h('div', { style: { fontSize: '32px' } }, '🗂️'),
    h('div', { style: { marginTop: '8px', color: 'rgba(0,0,0,0.45)' } }, '暂无数据'),
  ]);
</script>

<template>
  <Table :columns="columns" :data-source="[]" :empty-text="renderEmpty" bordered />
</template>
