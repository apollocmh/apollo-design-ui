<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Button, Space, Table, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

interface RowData {
  [key: string]: unknown;
  key: string;
  name: string;
  age: number;
  address: string;
}

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 100 },
  { title: 'Address', dataIndex: 'address', key: 'address' },
];

const data: RowData[] = Array.from({ length: 18 }, (_unused, index) => ({
  key: String(index + 1),
  name: `User ${index + 1}`,
  age: 20 + (index % 20),
  address: `No. ${index + 1} Lake Park, ${index % 2 === 0 ? 'London' : 'Sydney'}`,
}));

const scrollArea = ref<HTMLElement | null>(null);

function scrollToBottom(): void {
  const area = scrollArea.value;
  if (!area) return;
  area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
}

function scrollToTop(): void {
  scrollArea.value?.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <Button type="primary" @click="scrollToBottom">滚动到底部</Button>
      <Button @click="scrollToTop">回到顶部</Button>
      <Tag color="blue">sticky 表头吸附在滚动容器顶部</Tag>
    </Space>

    <div ref="scrollArea" class="sticky-container-demo-scroll">
      <Table
        :columns="columns"
        :data-source="data"
        :pagination="false"
        :sticky="{ offsetHeader: 0 }"
      />
    </div>
  </div>
</template>

<style scoped>
.sticky-container-demo-scroll {
  height: 260px;
  overflow: auto;
  border: 1px solid var(--apollo-color-border);
  border-radius: var(--apollo-border-radius-lg);
}
</style>
