<script setup lang="ts">
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string>();

const treeData = [
  { id: 'p1', value: 'p1', title: 'Parent 1', pId: '' },
  { id: 'c1', value: 'c1', title: 'Child 1', pId: 'p1' },
];
</script>

<template>
  <TreeSelect v-model:value="value" tree-data-simple-mode :tree-data="treeData" placeholder="simple mode" />
</template>
