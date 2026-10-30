<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';
import { onMounted, ref, shallowRef } from 'vue';

interface RecordType {
  key: string;
  name: string;
  gender: 'male' | 'female';
  email: string;
}

const columns: TableColumnsType<RecordType> = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Gender', dataIndex: 'gender' },
  { title: 'Email', dataIndex: 'email' },
];

const data = ref<RecordType[]>([]);
const loading = ref(false);
const pagination = shallowRef<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 });

/** 用一个本地的「假接口」代替真实请求 —— 示例保持离线可跑、结果确定。 */
const DB: RecordType[] = Array.from({ length: 46 }, (_unused, i) => ({
  key: String(i),
  name: i % 2 === 0 ? `Edward King ${i}` : `Lucy White ${i}`,
  gender: i % 2 === 0 ? 'male' : 'female',
  email: `user${i}@example.com`,
}));

async function fakeFetch(params: {
  current?: number;
  pageSize?: number;
}): Promise<{ results: RecordType[]; total: number }> {
  const current = params.current ?? 1;
  const pageSize = params.pageSize ?? 10;
  const start = (current - 1) * pageSize;
  return { results: DB.slice(start, start + pageSize), total: DB.length };
}

async function fetchData(page = pagination.value): Promise<void> {
  loading.value = true;
  try {
    const res = await fakeFetch({ current: page.current, pageSize: page.pageSize });
    data.value = res.results;
    // Pagination is replaced atomically; only the current page request belongs to this service.
    pagination.value = {
      current: page.current ?? 1,
      pageSize: page.pageSize ?? 10,
      total: res.total,
    };
  } finally {
    loading.value = false;
  }
}

// ⭐ 服务端分页：`pagination` 受控 + 在 change 里重新拉数据
async function onChange(next: TablePaginationConfig): Promise<void> {
  // The data service consumes only the requested page and page size.
  await fetchData({
    current: next.current ?? 1,
    pageSize: next.pageSize ?? pagination.value.pageSize ?? 10,
  });
}

onMounted(() => {
  void fetchData();
});
</script>

<template>
  <Table
    :columns="columns"
    :data-source="data"
    :loading="loading"
    :pagination="pagination"
    @change="onChange"
  />
</template>
