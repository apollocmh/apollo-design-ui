<script setup lang="ts">
import type { TableColumnsType, TableFilterValue, TableProps } from '@apollo-design/ui';
import { Button, Space, Table, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const nameFilter = ref<TableFilterValue | null>(null);
const roleFilter = ref<TableFilterValue | null>(null);
const lastAction = ref('尚未筛选');

const columns = computed<TableColumnsType>(() => [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    filters: [
      { text: 'John Brown', value: 'John Brown' },
      { text: 'Jim Green', value: 'Jim Green' },
      { text: 'Joe Black', value: 'Joe Black' },
    ],
    filteredValue: nameFilter.value,
    onFilter: (value: unknown, record: Record<string, unknown>) =>
      String(record.name).includes(String(value)),
  },
  {
    title: 'Role',
    dataIndex: 'role',
    key: 'role',
    filterMultiple: false,
    filters: [
      { text: 'Engineer', value: 'engineer' },
      { text: 'Designer', value: 'designer' },
      { text: 'Manager', value: 'manager' },
    ],
    filteredValue: roleFilter.value,
    onFilter: (value: unknown, record: Record<string, unknown>) => record.role === value,
  },
  { title: 'City', dataIndex: 'city', key: 'city' },
]);

const data = [
  { key: '1', name: 'John Brown', role: 'engineer', city: 'New York' },
  { key: '2', name: 'Jim Green', role: 'designer', city: 'London' },
  { key: '3', name: 'Joe Black', role: 'manager', city: 'Sydney' },
  { key: '4', name: 'Jim Red', role: 'engineer', city: 'London' },
];

const activeFilters = computed(() => {
  const labels: string[] = [];
  if (nameFilter.value?.length) labels.push(`姓名：${nameFilter.value.map(String).join('、')}`);
  if (roleFilter.value?.length) labels.push(`角色：${roleFilter.value.map(String).join('、')}`);
  return labels;
});

const onTableChange: TableProps['onChange'] = (_pagination, filters) => {
  nameFilter.value = filters.name ?? null;
  roleFilter.value = filters.role ?? null;
  lastAction.value = '筛选条件已更新';
};

function resetFilters(): void {
  nameFilter.value = null;
  roleFilter.value = null;
  lastAction.value = '已重置全部筛选条件';
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <Button @click="resetFilters">重置筛选</Button>
      <Tag color="blue">{{ lastAction }}</Tag>
      <Tag>{{ activeFilters.length ? activeFilters.join('；') : '当前无筛选条件' }}</Tag>
    </Space>

    <Table
      :columns="columns"
      :data-source="data"
      :pagination="false"
      @change="onTableChange"
    />
  </div>
</template>
