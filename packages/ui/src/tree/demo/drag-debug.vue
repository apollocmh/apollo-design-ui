<script setup lang="ts">
import { Tree } from '@apollo-design/ui';

const treeData = [
  { title: '0-0', key: '0-0', children: [{ title: '0-0-0', key: '0-0-0' }] },
  { title: '0-1', key: '0-1' },
];
</script>

<template>
  <Tree draggable :tree-data="treeData" default-expand-all />
</template>
