<script setup lang="ts">
import { ConfigProvider, Tree } from '@apollo-design/ui';

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
  <ConfigProvider
    :theme="{ components: { Tree: { titleHeight: '30px', nodeSelectedBg: '#b5f5ec' } } }"
  >
    <Tree :tree-data="treeData" default-expand-all block-node />
  </ConfigProvider>
</template>
