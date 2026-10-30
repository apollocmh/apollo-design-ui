<script setup lang="ts">
import { DownOutlined } from '@apollo-design/icons';
import { Tree } from '@apollo-design/ui';

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    children: [{ title: 'leaf', key: '0-0-0' }],
  },
];
</script>

<template>
  <Tree default-expand-all :tree-data="treeData">
    <template #switcherIcon="{ node }"><DownOutlined :data-expanded="node.expanded" /></template>
  </Tree>
</template>
