<script setup lang="ts">
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string>();
const treeData = [{ title: 'leaf', value: '0-0-0' }];
</script>

<template>
  <div style="display: flex; flex-direction: column; row-gap: 12px">
    <TreeSelect v-model:value="value" size="large" :tree-data="treeData" placeholder="large" />
    <TreeSelect v-model:value="value" :tree-data="treeData" placeholder="middle" />
    <TreeSelect v-model:value="value" size="small" :tree-data="treeData" placeholder="small" />
  </div>
</template>
