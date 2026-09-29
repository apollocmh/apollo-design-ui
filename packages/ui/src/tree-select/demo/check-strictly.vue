<script setup lang="ts">
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref([{ value: '0-0-0', label: 'leaf 1', halfChecked: false }]);

const treeData = [
  {
    title: 'parent 1',
    value: '0-0',
    children: [
      { title: 'leaf 1', value: '0-0-0' },
      { title: 'leaf 2', value: '0-0-1' },
    ],
  },
];
</script>

<template>
  <TreeSelect v-model:value="value" tree-checkable tree-check-strictly show-search :tree-data="treeData" placeholder="请选择" />
</template>
