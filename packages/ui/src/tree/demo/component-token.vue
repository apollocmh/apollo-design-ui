<script setup lang="ts">
import { Button, ConfigProvider, DirectoryTree, Tree } from '@apollo-design/ui';
import { ref } from 'vue';

const custom = ref(true);
const treeData = [
  {
    key: 'folder',
    title: '文件夹',
    children: [
      { key: 'file', title: '文件' },
      { key: 'other', title: '另一文件' },
    ],
  },
];
const tokens = {
  titleHeight: 32,
  switcherSize: 28,
  indentSize: 36,
  nodeHoverBg: '#e6fffb',
  nodeHoverColor: '#006d75',
  nodeSelectedBg: '#b5f5ec',
  nodeSelectedColor: '#00474f',
  directoryNodeSelectedBg: '#006d75',
  directoryNodeSelectedColor: '#ffffff',
};
</script>

<template>
  <Button @click="custom = !custom">{{ custom ? '恢复默认 Token' : '使用自定义 Token' }}</Button>
  <ConfigProvider :theme="{ components: { Tree: custom ? tokens : {} } }">
    <Tree :tree-data="treeData" default-expand-all block-node :selected-keys="['file']" />
    <DirectoryTree :tree-data="treeData" default-expand-all :selected-keys="['file']" />
  </ConfigProvider>
</template>
