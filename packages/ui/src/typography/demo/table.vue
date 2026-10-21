<script setup lang="ts">
// 表格内文本：在 Table 单元格中使用 Typography 系列组件
import type { TableColumnsType } from '@apollo-design/ui';
import { Paragraph, Table, Text, Title } from '@apollo-design/ui';
import { h } from 'vue';

const columns: TableColumnsType = [
  {
    title: '成员',
    dataIndex: 'name',
    key: 'name',
    width: 160,
    render: (value: unknown) => h(Text, { strong: true }, { default: () => String(value) }),
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    width: 180,
    render: (value: unknown) => h(Text, { type: 'secondary' }, { default: () => String(value) }),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (value: unknown) =>
      h(Text, { type: value === '正常' ? 'success' : 'danger' }, { default: () => String(value) }),
  },
  {
    title: '说明',
    dataIndex: 'note',
    key: 'note',
    render: (value: unknown) =>
      h(Paragraph, { style: 'margin: 0' }, { default: () => String(value) }),
  },
];

const data: Record<string, unknown>[] = [
  {
    key: '1',
    name: '林晓',
    role: '设计负责人',
    status: '正常',
    note: '负责设计规范与组件视觉基线。',
  },
  { key: '2', name: '周澄', role: '前端工程师', status: '正常', note: '维护文档站与示例工程。' },
  {
    key: '3',
    name: '赵岚',
    role: '质量工程师',
    status: '停用',
    note: '负责可访问性与视觉回归测试。',
  },
];
</script>

<template>
  <div style="width: 720px">
    <Title :level="4" style="margin-bottom: 4px">项目成员</Title>
    <Paragraph type="secondary" style="margin-bottom: 16px">
      单元格中的名称、角色、状态与说明分别使用 Text / Paragraph 渲染。
    </Paragraph>
    <Table :columns="columns" :data-source="data" :pagination="false" />
  </div>
</template>
