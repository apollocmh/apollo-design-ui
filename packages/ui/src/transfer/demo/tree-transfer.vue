<script lang="ts" setup>
import type {
  TransferItem,
  TransferKey,
  TransferListSlotProps,
  TreeCheckedKeys,
} from '@apollo-design/ui';
import { Transfer, Tree } from '@apollo-design/ui';
import { ref } from 'vue';

interface TreeNode {
  key: TransferKey;
  title: string;
  disabled: boolean;
  children?: TreeNode[];
}

const transferDataSource: TransferItem[] = [
  { key: '0-0', title: '内容一' },
  { key: '0-1', title: '内容二' },
  { key: '0-1-0', title: '内容二一' },
  { key: '0-1-1', title: '内容二二' },
  { key: '0-2', title: '内容三' },
  { key: '0-3', title: '内容四' },
];
const targetKeys = ref<TransferKey[]>([]);
// Each panel contains its own filtered data. Grouping is visual; checkStrictly keeps transfer keys independent.
const treeData = (items: TransferItem[]): TreeNode[] => {
  const nodes: TreeNode[] = items.map((item) => ({
    key: item.key,
    title: String(item.title),
    disabled: !!item.disabled,
  }));
  const parent = nodes.find((node) => node.key === '0-1');
  if (!parent) return nodes;
  parent.children = nodes.filter((node) => String(node.key).startsWith('0-1-'));
  return nodes.filter((node) => !parent.children?.includes(node));
};
const select = (scope: TransferListSlotProps, keys: TransferKey[] | TreeCheckedKeys) => {
  scope.onItemSelectAll(Array.isArray(keys) ? keys : keys.checked, 'replace');
};
</script>

<template>
  <Transfer :data-source="transferDataSource" :target-keys="targetKeys" class="tree-transfer" @change="targetKeys = $event">
    <template #list="scope">
      <Tree class="tree-transfer-list" checkable check-strictly default-expand-all :disabled="scope.disabled" :tree-data="treeData(scope.filteredItems)" :checked-keys="scope.selectedKeys" @update:checked-keys="select(scope, $event)" />
    </template>
  </Transfer>
</template>

<style scoped>
.tree-transfer :deep(.tree-transfer-list) { padding: 8px; width: 100%; height: 100%; }
</style>
