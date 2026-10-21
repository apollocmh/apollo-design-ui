<script setup lang="ts">
import type { TableColumnsType, TableExpandableConfig, TableKey } from '@apollo-design/ui';
import { Button, Space, Table, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

interface TreeRow {
  [key: string]: unknown;
  key: string;
  name: string;
  description: string;
  owner: string;
  children?: TreeRow[];
}

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 210, ellipsis: true },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    width: 300,
    ellipsis: true,
  },
  { title: 'Owner', dataIndex: 'owner', key: 'owner', width: 110 },
];

const data: TreeRow[] = [
  {
    key: '1',
    name: 'Design system foundation',
    description:
      'Design tokens, theme algorithms and shared CSS variables used by every component package.',
    owner: 'Alice',
    children: [
      {
        key: '1-1',
        name: 'Color tokens and semantic aliases',
        description:
          'Seed, map and alias token layers with a generated CSS variable contract for runtime and static styling.',
        owner: 'Bob',
        children: [
          {
            key: '1-1-1',
            name: 'Dark theme algorithm validation',
            description:
              'Validate dark theme output against the visual baseline and keep the token names stable.',
            owner: 'Carol',
          },
        ],
      },
      {
        key: '1-2',
        name: 'Typography scale',
        description: 'Font size, line height and heading spacing shared across data-dense pages.',
        owner: 'David',
      },
    ],
  },
  {
    key: '2',
    name: 'Interaction patterns',
    description:
      'Keyboard navigation, focus rings and hover feedback for complex data entry workflows.',
    owner: 'Eve',
    children: [
      {
        key: '2-1',
        name: 'Table keyboard navigation',
        description: 'Arrow keys, Home / End and expandable row behavior inside scrollable tables.',
        owner: 'Frank',
      },
    ],
  },
];

const allKeys = data.map((item) => item.key);
const expandedRowKeys = ref<TableKey[]>(['1']);

const expandable = computed<TableExpandableConfig>(() => ({
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
      <Button type="primary" @click="expandAll">展开全部</Button>
      <Button @click="collapseAll">收起全部</Button>
      <Tag color="blue">已展开 {{ expandedRowKeys.length }} 个根节点</Tag>
      <Tag>悬停省略文本可查看完整内容</Tag>
    </Space>

    <Table
      :columns="columns"
      :data-source="data"
      :pagination="false"
      :expandable="expandable"
      :scroll="{ x: 640 }"
      style="max-width: 680px"
    />
  </div>
</template>
