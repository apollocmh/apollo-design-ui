<script setup lang="ts">
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string>();
const treeData = [{ title: 'leaf', value: '0-0-0' }];
</script>

<template>
  <TreeSelect v-model:value="value" :tree-data="treeData">
    <template #placeholder>
      <span style="color: #bfbfbf">自定义 placeholder</span>
    </template>
  </TreeSelect>
</template>
