<script setup lang="ts">
// 对齐 antd 的 `block-node` demo：blockNode 让节点占据整行。
import type { TreeKey } from '@apollo-design/ui';
import { Switch, Text, Tree } from '@apollo-design/ui';
import { ref } from 'vue';

const blockNode = ref(true);
const selectedKeys = ref<TreeKey[]>(['0-0-1']);

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    children: [
      {
        title: 'parent 1-0',
        key: '0-0-0',
        children: [
          { title: 'leaf 1-0-0', key: '0-0-0-0' },
          { title: 'leaf 1-0-1', key: '0-0-0-1' },
        ],
      },
      {
        title: 'parent 1-1',
        key: '0-0-1',
        children: [
          { title: 'leaf 1-1-0', key: '0-0-1-0' },
          { title: 'leaf 1-1-1', key: '0-0-1-1' },
        ],
      },
    ],
  },
  {
    title: 'parent 2',
    key: '0-1',
    children: [
      { title: 'leaf 2-0', key: '0-1-0' },
      { title: 'leaf 2-1', key: '0-1-1' },
    ],
  },
];
</script>

<template>
  <div>
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px">
      <Text>blockNode</Text>
      <Switch v-model:checked="blockNode" aria-label="整行节点" />
      <Text type="secondary">selected: {{ selectedKeys.join(', ') || '（未选中）' }}</Text>
    </div>
    <Tree
      v-model:selected-keys="selectedKeys"
      :tree-data="treeData"
      :block-node="blockNode"
      default-expand-all
      style="width: 320px"
    />
  </div>
</template>
