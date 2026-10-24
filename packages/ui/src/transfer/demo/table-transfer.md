---
order: 8
title:
  zh-CN: 表格穿梭框
  en-US: Table Transfer
---

通过 `#list` 把左右两列交给 `Table` 渲染：勾选行与行点击都会回写 `selectedKeys`，
分页与 `rowKey` 走 Table 自身语义（对齐 antd `table-transfer.tsx`）。


```vue
<script lang="ts" setup>
import type {
  TableColumnsType,
  TableRowSelection,
  TransferItem,
  TransferKey,
  TransferListSlotProps,
} from '@apollo-design/ui';
import { Table, Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData: TransferItem[] = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  description: `description of content${i + 1}`,
  disabled: i % 4 === 0,
}));
const targetKeys = ref<TransferKey[]>(
  mockData.filter((item) => Number(item.key) % 3 > 1).map((item) => item.key),
);
const columns: TableColumnsType = [
  { title: 'Name', dataIndex: 'title' },
  { title: 'Description', dataIndex: 'description' },
];
const rowSelection = (scope: TransferListSlotProps): TableRowSelection => ({
  selectedRowKeys: scope.selectedKeys,
  getCheckboxProps: (record) => ({ disabled: scope.disabled || !!record.disabled }),
  onSelect: (record, selected) => {
    if (typeof record.key === 'string' || typeof record.key === 'number') {
      scope.onItemSelect(record.key, selected);
    }
  },
  onSelectAll: (selected, _selectedRows, changedRows) =>
    scope.onItemSelectAll(
      changedRows.flatMap((record) =>
        typeof record.key === 'string' || typeof record.key === 'number' ? [record.key] : [],
      ),
      selected,
    ),
});
</script>

<template>
  <Transfer :data-source="mockData" :target-keys="targetKeys" :show-select-all="false" class="table-transfer" @change="targetKeys = $event">
    <template #list="scope">
      <Table class="table-transfer-list" size="small" :columns="columns" :data-source="scope.filteredItems" row-key="key" :pagination="{ pageSize: 5 }" :row-selection="rowSelection(scope)" />
    </template>
  </Transfer>
</template>

<style scoped>
.table-transfer :deep(.table-transfer-list) { padding: 0 4px; width: 100%; height: 100%; }
</style>
```
