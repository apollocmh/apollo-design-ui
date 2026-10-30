<script setup lang="ts">
import type { TreeSelectValue } from '@apollo-design/ui';
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<TreeSelectValue>();
const search = ref('');
const open = ref(false);

const treeData = [
  {
    title: 'parent 1',
    value: '0-0',
    children: [
      { title: 'leaf 1', value: '0-0-0' },
      { title: 'leaf 2', value: '0-0-1' },
    ],
  },
  { title: 'parent 2', value: '0-1' },
];
</script>

<template>
  <TreeSelect aria-label="Tree select: basic" v-model:value="value" v-model:search-value="search" v-model:open="open" show-search :tree-data="treeData" placeholder="请选择" />
</template>
