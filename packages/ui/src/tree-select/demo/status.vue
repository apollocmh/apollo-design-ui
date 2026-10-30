<script setup lang="ts">
import type { TreeSelectValue } from '@apollo-design/ui';
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<TreeSelectValue>();

const treeData = [{ title: 'parent', value: '0-0', children: [{ title: 'leaf', value: '0-0-0' }] }];
</script>

<template>
  <div style="display: flex; flex-direction: column; row-gap: 12px">
    <TreeSelect aria-label="Tree select: status" v-model:value="value" status="error" :tree-data="treeData" placeholder="error" />
    <TreeSelect aria-label="Tree select: status" v-model:value="value" status="warning" :tree-data="treeData" placeholder="warning" />
  </div>
</template>
