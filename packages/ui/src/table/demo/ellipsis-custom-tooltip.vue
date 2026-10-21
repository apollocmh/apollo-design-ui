<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Select, Space, Table, Tag, Tooltip } from '@apollo-design/ui';
import { computed, h, ref } from 'vue';

type TooltipPlacement = 'topLeft' | 'top' | 'topRight';

const placement = ref<TooltipPlacement>('topLeft');
const placementOptions: { value: TooltipPlacement; label: string }[] = [
  { value: 'topLeft', label: 'topLeft' },
  { value: 'top', label: 'top' },
  { value: 'topRight', label: 'topRight' },
];

interface RowData {
  [key: string]: unknown;
  key: string;
  name: string;
  description: string;
}

const data: RowData[] = [
  {
    key: '1',
    name: 'Long text',
    description:
      'This is a very long description that will be truncated in the table cell, and the full content is shown in a custom tooltip instead of the native title attribute.',
  },
  {
    key: '2',
    name: 'Another row',
    description:
      'Hover the ellipsis text to inspect the custom placement. The tooltip content comes from render(), so it can be composed freely.',
  },
  {
    key: '3',
    name: 'Short',
    description: 'Short content still uses the same custom tooltip.',
  },
];

const columns = computed<TableColumnsType>(() => [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 130 },
  {
    title: 'Description（自定义 Tooltip）',
    dataIndex: 'description',
    key: 'description',
    width: 320,
    ellipsis: { showTitle: false },
    render: (_value: unknown, record: Record<string, unknown>) =>
      h(
        Tooltip,
        { title: String(record.description), placement: placement.value },
        {
          default: () => h('span', { style: { cursor: 'help' } }, String(record.description)),
        },
      ),
  },
]);

function onPlacementChange(value: unknown): void {
  placement.value = value as TooltipPlacement;
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>Tooltip 方位</span>
      <Select
        aria-label="Tooltip 方位"
        :value="placement"
        :options="placementOptions"
        style="width: 130px"
        @change="onPlacementChange"
      />
      <Tag color="blue">{{ placement }}</Tag>
    </Space>

    <Table
      :columns="columns"
      :data-source="data"
      :pagination="false"
      style="max-width: 560px"
    />
  </div>
</template>
