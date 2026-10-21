<script setup lang="ts">
import type { TableColumnsType, TableExpandableConfig, TableKey } from '@apollo-design/ui';
import { Button, Space, Table, Tag } from '@apollo-design/ui';
import { computed, h, ref } from 'vue';

interface RowData {
  [key: string]: unknown;
  key: string;
  name: string;
  owner: string;
  progress: number;
}

const columns: TableColumnsType = [
  { title: 'Task', dataIndex: 'name', key: 'name' },
  { title: 'Owner', dataIndex: 'owner', key: 'owner', width: 140 },
  { title: 'Progress', dataIndex: 'progress', key: 'progress', width: 120 },
];

const data: RowData[] = Array.from({ length: 14 }, (_unused, index) => ({
  key: String(index + 1),
  name: `Release checklist ${index + 1}`,
  owner: ['Alice', 'Bob', 'Carol', 'David'][index % 4] ?? 'Alice',
  progress: 20 + index * 5,
}));

const allKeys = data.map((item) => item.key);
const expandedRowKeys = ref<TableKey[]>(['1', '2']);

const expandable = computed<TableExpandableConfig>(() => ({
  expandedRowKeys: expandedRowKeys.value,
  onExpandedRowsChange: (keys: TableKey[]) => {
    expandedRowKeys.value = keys;
  },
  expandedRowRender: (record: Record<string, unknown>) =>
    h(
      'div',
      {
        style: {
          display: 'flex',
          gap: '24px',
          alignItems: 'center',
          flexWrap: 'wrap',
        },
      },
      [
        h('strong', null, `任务详情 #${String(record.key)}`),
        h('span', null, `负责人：${String(record.owner)}`),
        h('span', null, `当前进度：${String(record.progress)}%`),
        h('span', null, '滚动容器内的 sticky 表头会保持吸附。'),
      ],
    ),
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
      <Button type="primary" @click="expandAll">全部展开</Button>
      <Button @click="collapseAll">全部收起</Button>
      <Tag color="blue">已展开 {{ expandedRowKeys.length }} 行</Tag>
    </Space>

    <div class="expand-sticky-demo-scroll">
      <Table
        :columns="columns"
        :data-source="data"
        :pagination="false"
        :expandable="expandable"
        :sticky="{ offsetHeader: 0 }"
      />
    </div>
  </div>
</template>

<style scoped>
.expand-sticky-demo-scroll {
  height: 300px;
  overflow: auto;
  border: 1px solid var(--apollo-color-border);
  border-radius: var(--apollo-border-radius-lg);
}
</style>
