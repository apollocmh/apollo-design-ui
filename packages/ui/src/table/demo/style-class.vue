<script setup lang="ts">
import type {
  TableColumnsType,
  TableSemanticClassNames,
  TableSemanticStyles,
} from '@apollo-design/ui';
import { Select, Space, Table, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

type StyleTheme = 'blue' | 'warm';

const theme = ref<StyleTheme>('blue');
const themeOptions: { value: StyleTheme; label: string }[] = [
  { value: 'blue', label: 'Blue' },
  { value: 'warm', label: 'Warm' },
];

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 100 },
  { title: 'City', dataIndex: 'city', key: 'city' },
];

const data = [
  { key: '1', name: 'John Brown', age: 32, city: 'New York' },
  { key: '2', name: 'Jim Green', age: 42, city: 'London' },
  { key: '3', name: 'Joe Black', age: 28, city: 'Sydney' },
  { key: '4', name: 'Jim Red', age: 32, city: 'London' },
];

const classNames = computed<TableSemanticClassNames>(() => ({
  root: 'table-style-class-root',
  title: 'table-style-class-title',
  header: {
    wrapper: 'table-style-class-header',
    row: 'table-style-class-header-row',
    cell: 'table-style-class-header-cell',
  },
  body: {
    row: 'table-style-class-body-row',
    cell: 'table-style-class-body-cell',
  },
  footer: 'table-style-class-footer',
}));

const styles = computed<TableSemanticStyles>(() => ({
  root: {
    border: `1px solid ${theme.value === 'blue' ? '#91caff' : '#ffd591'}`,
    borderRadius: '12px',
    overflow: 'hidden',
  },
  title: {
    padding: '14px 18px',
    fontWeight: '600',
  },
  header: {
    cell: {
      background: theme.value === 'blue' ? '#e6f4ff' : '#fff7e6',
      color: theme.value === 'blue' ? '#0958d9' : '#ad4e00',
      letterSpacing: '0.02em',
    },
  },
  body: {
    row: {
      background: theme.value === 'blue' ? '#fbfdff' : '#fffdf7',
    },
  },
  footer: {
    padding: '12px 18px',
  },
}));

function onThemeChange(value: unknown): void {
  theme.value = value as StyleTheme;
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>语义样式主题</span>
      <Select
        aria-label="语义样式主题"
        :value="theme"
        :options="themeOptions"
        style="width: 120px"
        @change="onThemeChange"
      />
      <Tag color="blue">{{ theme }}</Tag>
    </Space>

    <Table
      :columns="columns"
      :data-source="data"
      :pagination="false"
      :class-names="classNames"
      :styles="styles"
      title="Style Class"
      footer="classNames / styles 同时作用于根、表头、表体与标题槽"
    />
  </div>
</template>

<style>
.table-style-class-root .table-style-class-header-cell {
  font-weight: 600;
}

.table-style-class-root .table-style-class-body-row:hover > td {
  transition: background-color 0.2s ease;
}

.table-style-class-footer {
  color: var(--apollo-color-text-secondary);
}
</style>
