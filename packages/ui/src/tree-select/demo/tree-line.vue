<script setup lang="ts">
import type { TreeSelectValue } from '@apollo-design/ui';
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<TreeSelectValue>();
const treeData = [
  {
    title: 'parent 1',
    value: '0-0',
    children: [{ title: 'leaf 1', value: '0-0-0' }],
  },
];
</script>

<template>
  <TreeSelect aria-label="Tree select: tree line" v-model:value="value" :tree-line="true" :tree-data="treeData" placeholder="连接线" />
</template>
