<script setup lang="ts">
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string>();

const treeData = [{ title: 'parent', value: '0-0', children: [{ title: 'leaf', value: '0-0-0' }] }];
</script>

<template>
  <div style="display: flex; flex-direction: column; row-gap: 12px">
    <TreeSelect v-model:value="value" status="error" :tree-data="treeData" placeholder="error" />
    <TreeSelect v-model:value="value" status="warning" :tree-data="treeData" placeholder="warning" />
  </div>
</template>
