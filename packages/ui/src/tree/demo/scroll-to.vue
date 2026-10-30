<script setup lang="ts">
import { Button, Tree, type TreeRef } from '@apollo-design/ui';
import { nextTick, ref } from 'vue';
import type { DataNode, TreeKey } from '../interface';

const TARGET_KEY = 'target';
const treeRef = ref<TreeRef | null>(null);
const expandedKeys = ref<TreeKey[]>([]);
const treeData: DataNode[] = [
  ...Array.from({ length: 60 }, (_, index) => ({
    key: `row-${index}`,
    title: `节点 ${index + 1}`,
  })),
  {
    key: 'folder',
    title: '目标文件夹',
    children: [
      {
        key: 'nested',
        title: '子文件夹',
        children: [{ key: TARGET_KEY, title: '目标节点', isLeaf: true }],
      },
    ],
  },
];
const scrollTo = () =>
  treeRef.value?.scrollTo({ key: TARGET_KEY, autoExpand: true, align: 'bottom' });
const reset = async () => {
  expandedKeys.value = [];
  await nextTick();
  treeRef.value?.scrollTo(0);
};
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <div><Button @click="scrollTo">展开并定位到目标节点</Button> <Button @click="reset">复位</Button></div>
    <Tree ref="treeRef" v-model:expanded-keys="expandedKeys" :height="200" :tree-data="treeData" />
  </div>
</template>
