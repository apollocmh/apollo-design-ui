<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Select, Space, Switch, Table, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

type TableSize = 'large' | 'middle' | 'small';

const bordered = ref(true);
const loading = ref(false);
const showHeader = ref(true);
const rowHoverable = ref(true);
const size = ref<TableSize>('large');

const sizeOptions: { value: TableSize; label: string }[] = [
  { value: 'large', label: 'large' },
  { value: 'middle', label: 'middle' },
  { value: 'small', label: 'small' },
];

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 100 },
  { title: 'City', dataIndex: 'city', key: 'city' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
];

const data = Array.from({ length: 6 }, (_unused, index) => ({
  key: String(index + 1),
  name: `User ${index + 1}`,
  age: 24 + index,
  city: ['London', 'New York', 'Sydney'][index % 3],
  email: `user${index + 1}@example.com`,
}));

const summary = computed(() =>
  [
    bordered.value ? 'bordered' : 'borderless',
    `size=${size.value}`,
    showHeader.value ? 'showHeader' : '隐藏表头',
    rowHoverable.value ? 'hoverable' : '无行悬停',
    loading.value ? 'loading' : 'idle',
  ].join(' · '),
);

function onSizeChange(value: unknown): void {
  size.value = value as TableSize;
}
</script>

<template>
  <div>
    <Space :size="16" wrap style="margin-bottom: 16px">
      <Space :size="6">
        <Switch v-model:checked="bordered" aria-label="显示边框" />
        <span>边框</span>
      </Space>
      <Space :size="6">
        <Switch v-model:checked="loading" aria-label="显示加载状态" />
        <span>加载中</span>
      </Space>
      <Space :size="6">
        <Switch v-model:checked="showHeader" aria-label="显示表头" />
        <span>表头</span>
      </Space>
      <Space :size="6">
        <Switch v-model:checked="rowHoverable" aria-label="启用行悬停" />
        <span>行悬停</span>
      </Space>
      <Select
        aria-label="表格尺寸"
        :value="size"
        :options="sizeOptions"
        style="width: 120px"
        @change="onSizeChange"
      />
    </Space>

    <Tag color="blue" style="margin-bottom: 16px">{{ summary }}</Tag>

    <Table
      :columns="columns"
      :data-source="data"
      :pagination="false"
      :bordered="bordered"
      :loading="loading"
      :show-header="showHeader"
      :row-hoverable="rowHoverable"
      :size="size"
    />
  </div>
</template>
