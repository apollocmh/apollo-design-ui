<script setup lang="ts">
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string>();
const treeData = [
  {
    title: 'parent 1',
    value: '0-0',
    children: [{ title: 'leaf 1', value: '0-0-0' }],
  },
];
</script>

<template>
  <TreeSelect v-model:value="value" :tree-line="true" :tree-data="treeData" placeholder="连接线" />
</template>
