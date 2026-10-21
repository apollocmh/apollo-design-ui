<script setup lang="ts">
import type { TableColumnsType, TableProps } from '@apollo-design/ui';
import { Space, Table, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  {
    title: 'Department',
    dataIndex: 'department',
    key: 'department',
    // 树形筛选菜单 + 可搜索
    filterMode: 'tree',
    filterSearch: true,
    filters: [
      {
        text: 'Engineering',
        value: 'engineering',
        children: [
          { text: 'Frontend', value: 'frontend' },
          { text: 'Backend', value: 'backend' },
        ],
      },
      {
        text: 'Design',
        value: 'design',
        children: [
          { text: 'Visual', value: 'visual' },
          { text: 'Interaction', value: 'interaction' },
        ],
      },
      { text: 'Marketing', value: 'marketing' },
    ],
    onFilter: (value: unknown, record: Record<string, unknown>) =>
      record.department === value || record.team === value,
  },
  { title: 'Team', dataIndex: 'team', key: 'team' },
];

const data = [
  { key: '1', name: 'Alice', department: 'engineering', team: 'frontend' },
  { key: '2', name: 'Bob', department: 'engineering', team: 'backend' },
  { key: '3', name: 'Carol', department: 'design', team: 'visual' },
  { key: '4', name: 'David', department: 'design', team: 'interaction' },
  { key: '5', name: 'Eve', department: 'marketing', team: 'growth' },
];

const activeFilters = ref<string[]>([]);

const onTableChange: TableProps['onChange'] = (_pagination, filters) => {
  activeFilters.value = (filters.department ?? []).map((value) => String(value));
};
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>部门筛选：</span>
      <Tag color="blue">
        {{ activeFilters.length ? activeFilters.join('、') : '未筛选' }}
      </Tag>
      <Tag>打开表头筛选菜单可搜索分类</Tag>
    </Space>

    <Table :columns="columns" :data-source="data" @change="onTableChange" />
  </div>
</template>
