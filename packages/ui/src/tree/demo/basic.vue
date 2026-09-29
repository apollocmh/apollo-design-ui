<script setup lang="ts">
// TODO(G11): 对齐 antd 的 basic demo（节点选择/展开/勾选交互演示）
import { ref } from 'vue';
import { Tree } from '../index';

const expandedKeys = ref(['0-0-0', '0-0-1']);
const selectedKeys = ref(['0-1']);
const checkedKeys = ref(['0-0-0']);

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    children: [
      { title: 'parent 1-0', key: '0-0-0', children: [{ title: 'leaf', key: '0-0-0-0' }] },
      { title: 'parent 1-1', key: '0-0-1', children: [{ title: 'leaf', key: '0-0-1-0' }] },
    ],
  },
];
</script>

<template>
  <Tree
    v-model:expandedKeys="expandedKeys"
    v-model:selectedKeys="selectedKeys"
    v-model:checkedKeys="checkedKeys"
    checkable
    :tree-data="treeData"
  />
</template>
