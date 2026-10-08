const e=`<!--
  table-transfer：\`renderList\` 通道的表格列表面板（对齐 antd \`demo/table-transfer.tsx\`）。

  列表体由 Table 渲染（selection 列勾选 + 行点击切换），勾选状态由 \`selectedKeys\`
  受控，行点击经 \`onItemSelect\` 回写；\`rowKey\`/\`pagination\` 走 Table 自身语义。
-->
<template>
  <Transfer
    v-model:target-keys="targetKeys"
    :data-source="mockData"
    :render-list="renderList"
    :render="renderItem"
    :show-select-all="false"
    class="table-transfer"
  />
</template>

<script lang="ts" setup>
import type { TransferItem, TransferKey, TransferListBodyProps } from '@apollo-design/ui';
import { Table, Transfer } from '@apollo-design/ui';
import { h, ref } from 'vue';

interface TableRecord {
  key: string;
  title: string;
  description: string;
  disabled: boolean;
}

const mockData: TransferItem[] = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: \`content\${i + 1}\`,
  description: \`description of content\${i + 1}\`,
  disabled: i % 4 === 0,
}));

const targetKeys = ref<TransferKey[]>(
  mockData.filter((item) => Number(item.key) % 3 > 1).map((item) => item.key),
);

const renderItem = (item: TransferItem) => String(item.title);

// ⚠️ Transfer 的 renderList prop 声明面是 \`(props: Record<string, unknown>) => VNodeChild\`
const renderList = (rawProps: Record<string, unknown>) => {
  const { filteredItems, selectedKeys, onItemSelect, disabled } =
    rawProps as unknown as TransferListBodyProps;
  return h(
    Table as never,
    {
      class: 'table-transfer-list',
      size: 'small',
      columns: [
        { title: 'Name', dataIndex: 'title' },
        { title: 'Description', dataIndex: 'description' },
      ],
      dataSource: filteredItems as never,
      rowKey: (record: TableRecord) => record.key,
      pagination: { pageSize: 5 },
      rowSelection: {
        selectedRowKeys: selectedKeys as never,
        // 与 antd 官方 demo 同判：勾选行 = onItemSelect(key, !selected)
        onSelect: (record: TableRecord) => {
          if (disabled || record.disabled) return;
          onItemSelect(record.key, !selectedKeys.includes(record.key));
        },
      },
    } as never,
  );
};
<\/script>

<style scoped>
.table-transfer :deep(.table-transfer-list) {
  padding: 0 4px;
  width: 100%;
  height: 100%;
}
</style>
`;export{e as default};
