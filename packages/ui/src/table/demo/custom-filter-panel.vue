<script setup lang="ts">
// ⚠️ table 的内部类型在根出口统一加 `Table` 前缀（`FilterDropdownProps`
//    → `TableFilterDropdownProps`），别照着 table/index.ts 的内部名直接引。
import type { TableColumnsType, TableFilterDropdownProps, TableKey } from '@apollo-design/ui';
import { Button, Input, Table } from '@apollo-design/ui';
import { h, ref } from 'vue';

const searchInput = ref('');

const columns: TableColumnsType = [
  {
    title: 'Name',
    dataIndex: 'name',
    // ⭐ 自定义筛选面板：`filterDropdown` 拿到 setSelectedKeys / confirm / clearFilters
    filterDropdown: (props: TableFilterDropdownProps) =>
      h('div', { style: { padding: '8px' } }, [
        h(Input, {
          value: searchInput.value,
          placeholder: 'Search name',
          style: { width: '188px', marginBottom: '8px', display: 'block' },
          'onUpdate:value': (v: string) => {
            searchInput.value = v;
          },
          onPressEnter: () => props.confirm({ closeDropdown: true }),
        }),
        h(
          Button,
          {
            type: 'primary',
            size: 'small',
            style: { width: '90px', marginRight: '8px' },
            onClick: () => {
              props.setSelectedKeys(searchInput.value ? [searchInput.value] : []);
              props.confirm({ closeDropdown: true });
            },
          },
          { default: () => 'Search' },
        ),
        h(
          Button,
          {
            size: 'small',
            style: { width: '90px' },
            onClick: () => {
              searchInput.value = '';
              props.clearFilters?.({ closeDropdown: true });
            },
          },
          { default: () => 'Reset' },
        ),
      ]),
    // 漏斗图标的高亮态由「是否有筛选值」决定
    onFilter: (value: unknown, record: Record<string, unknown>) =>
      (record.name as string).toLowerCase().includes(String(value).toLowerCase()),
    filterIcon: (filtered: boolean) =>
      h('span', { style: { color: filtered ? '#1677ff' : undefined } }, '🔍'),
  },
  { title: 'Age', dataIndex: 'age' },
  { title: 'Address', dataIndex: 'address' },
];

const data: Record<string, unknown>[] = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 28, address: 'Sydney No. 1 Lake Park' },
];

const onChange = (_p: unknown, filters: unknown) => {
  console.log('filters:', filters, 'keys:', (filters as Record<string, TableKey[]>)?.name);
};
</script>

<template>
  <Table :columns="columns" :data-source="data" @change="onChange" />
</template>
