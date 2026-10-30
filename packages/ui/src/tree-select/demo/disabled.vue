<script setup lang="ts">
import { TreeSelect } from '@apollo-design/ui';

const treeData = [
  { title: 'parent', value: '0-0', disabled: true, children: [{ title: 'leaf', value: '0-0-0' }] },
  { title: 'ok', value: '0-1' },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; row-gap: 12px">
    <TreeSelect aria-label="Tree select: disabled" :tree-data="treeData" placeholder="节点级 disabled" />
    <TreeSelect aria-label="Tree select: disabled" :tree-data="treeData" disabled placeholder="整树 disabled" />
  </div>
</template>
