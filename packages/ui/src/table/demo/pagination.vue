<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig, TableProps } from '@apollo-design/ui';
import { Table, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 100 },
  { title: 'City', dataIndex: 'city', key: 'city' },
];

const data = Array.from({ length: 42 }, (_unused, index) => ({
  key: String(index + 1),
  name: `User ${index + 1}`,
  age: 20 + (index % 20),
  city: ['London', 'New York', 'Sydney'][index % 3],
}));

const current = ref(1);
const pageSize = ref(5);

const pagination = computed<TablePaginationConfig>(() => ({
  current: current.value,
  pageSize: pageSize.value,
  total: data.length,
  showSizeChanger: true,
  pageSizeOptions: [5, 10, 20],
  showQuickJumper: true,
  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`,
}));

const onTableChange: TableProps['onChange'] = (nextPagination) => {
  current.value = nextPagination.current ?? 1;
  pageSize.value = nextPagination.pageSize ?? 5;
};
</script>

<template>
  <div>
    <Tag color="blue" style="margin-bottom: 16px">
      当前第 {{ current }} 页，每页 {{ pageSize }} 条（共 {{ data.length }} 条）
    </Tag>

    <Table
      :columns="columns"
      :data-source="data"
      :pagination="pagination"
      @change="onTableChange"
    />
  </div>
</template>
