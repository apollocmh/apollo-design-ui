<script setup lang="ts">
import type { TreeSelectValue } from '@apollo-design/ui';
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<TreeSelectValue>();
const treeData = [{ title: 'leaf', value: '0-0-0' }];
</script>

<template>
  <TreeSelect aria-label="Tree select: placeholder slot" v-model:value="value" :tree-data="treeData">
    <template #treeTitleRender="{ node }"><span>{{ node.title }}</span></template>
    <template #placeholder>
      <span style="color: #bfbfbf">自定义 placeholder</span>
    </template>
  </TreeSelect>
</template>
