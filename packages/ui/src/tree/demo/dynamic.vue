<script setup lang="ts">
import { Tree } from '@apollo-design/ui';
import { ref } from 'vue';

const initTreeData = [
  { title: 'Expand to load', key: '0' },
  { title: 'Expand to load', key: '1' },
  { title: 'Tree Node', key: '2', isLeaf: true },
];

const treeData = ref(initTreeData);

function updateTreeData(list: unknown[], key: unknown, children: unknown[]): unknown[] {
  return list.map((node) => {
    const n = node as { key: unknown; children?: unknown[] };
    if (n.key === key) {
      return { ...n, children };
    }
    if (n.children) {
      return { ...n, children: updateTreeData(n.children, key, children) };
    }
    return node;
  });
}

const onLoadData = (treeNode: { key: unknown; children?: unknown[] }) =>
  new Promise<void>((resolve) => {
    if (treeNode.children) {
      resolve();
      return;
    }
    setTimeout(() => {
      treeData.value = updateTreeData(treeData.value, treeNode.key, [
        { title: 'Child Node', key: `${String(treeNode.key)}-0` },
        { title: 'Child Node', key: `${String(treeNode.key)}-1` },
      ]);
      resolve();
    }, 1000);
  });
</script>

<template>
  <Tree :load-data="onLoadData" :tree-data="treeData" />
</template>
