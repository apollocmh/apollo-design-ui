<script setup lang="ts">
import type { TableColumnsType, TablePaginationConfig } from '@apollo-design/ui';
import { Table } from '@apollo-design/ui';
import { onMounted, ref } from 'vue';

interface RecordType {
  // ⚠️ 必须显式写索引签名：`dataSource` 收的是 `Record<string, unknown>[]`，
  //    而 TS **只给类型别名 / 推断出来的对象字面量**隐式索引签名，`interface`
  //    没有 —— 不加这一行就是 `Index signature for type 'string' is missing`。
  [key: string]: unknown;
  key: string;
  name: string;
  gender: 'male' | 'female';
  email: string;
}

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Gender', dataIndex: 'gender' },
  { title: 'Email', dataIndex: 'email' },
];

const data = ref<RecordType[]>([]);
const loading = ref(false);
const pagination = ref<TablePaginationConfig>({ current: 1, pageSize: 10, total: 0 });

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
    // ⚠️ 别写 `{ ...pagination.value, ... }`：展开 `TablePaginationConfig` 会把
    //    `showSizeChanger?: boolean | SelectProps` 一并实例化 ⇒ TS2589
    //    「Type instantiation is excessively deep and possibly infinite」。
    //    逐字段赋值只触及用到的三个字段，类型实例化立刻收敛。
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
  // 同上：只取用到的两个字段，避免展开 `TablePaginationConfig` 触发 TS2589。
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
