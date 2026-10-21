<script setup lang="ts">
import type {
  TableColumnsType,
  TablePaginationConfig,
  TablePaginationPlacement,
  TableProps,
} from '@apollo-design/ui';
import { Select, Space, Table, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

type PlacementMode = 'both' | 'top' | 'bottom';

const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 100 },
  { title: 'Address', dataIndex: 'address', key: 'address' },
];

const data = Array.from({ length: 23 }, (_unused, index) => ({
  key: String(index + 1),
  name: `User ${index + 1}`,
  age: 20 + (index % 20),
  address: `No. ${index + 1} Lake Park`,
}));

const placementMode = ref<PlacementMode>('both');
const current = ref(1);
const pageSize = ref(5);

const placementOptions: { value: PlacementMode; label: string }[] = [
  { value: 'both', label: '上下都有' },
  { value: 'top', label: '仅顶部' },
  { value: 'bottom', label: '仅底部' },
];

const placement = computed<TablePaginationPlacement[]>(() => {
  if (placementMode.value === 'top') return ['topEnd'];
  if (placementMode.value === 'bottom') return ['bottomCenter'];
  return ['topStart', 'bottomEnd'];
});

const pagination = computed<TablePaginationConfig>(() => ({
  current: current.value,
  pageSize: pageSize.value,
  total: data.length,
  showSizeChanger: true,
  pageSizeOptions: [5, 10],
  showTotal: (total: number) => `共 ${total} 条`,
  placement: placement.value,
}));

const onTableChange: TableProps['onChange'] = (nextPagination) => {
  current.value = nextPagination.current ?? 1;
  pageSize.value = nextPagination.pageSize ?? 5;
};

function onPlacementModeChange(value: unknown): void {
  placementMode.value = value as PlacementMode;
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>pagination.placement</span>
      <Select
        aria-label="分页位置"
        :value="placementMode"
        :options="placementOptions"
        style="width: 140px"
        @change="onPlacementModeChange"
      />
      <Tag color="blue">{{ placement.join(', ') }}</Tag>
      <Tag>当前第 {{ current }} 页</Tag>
    </Space>

    <Table
      :columns="columns"
      :data-source="data"
      :pagination="pagination"
      @change="onTableChange"
    />
  </div>
</template>
