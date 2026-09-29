<script setup lang="ts">
import { Tree } from '@apollo-design/ui';

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    children: [
      { title: 'leaf 1', key: '0-0-0' },
      { title: 'leaf 2', key: '0-0-1' },
    ],
  },
];
</script>

<template>
  <Tree
    :tree-data="treeData"
    default-expand-all
    :class-names="{ root: 'my-root', item: 'my-item' }"
    :styles="{ itemTitle: { fontStyle: 'italic' } }"
  />
</template>
