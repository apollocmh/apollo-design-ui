<script setup lang="ts">
import { DownOutlined } from '@apollo-design/icons';
import { Tree } from '@apollo-design/ui';
import { h } from 'vue';

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    children: [{ title: 'leaf', key: '0-0-0' }],
  },
];
</script>

<template>
  <Tree :switcher-icon="h(DownOutlined)" default-expand-all :tree-data="treeData" />
</template>
