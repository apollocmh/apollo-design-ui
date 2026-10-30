<script setup lang="ts">
import type { TreeSelectValue } from '@apollo-design/ui';
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<TreeSelectValue>();

const treeData = [
  {
    name: 'parent',
    id: '0-0',
    subs: [{ name: 'leaf', id: '0-0-0' }],
  },
];
</script>

<template>
  <TreeSelect aria-label="Tree select: field names"
    v-model:value="value"
    :tree-data="treeData"
    :field-names="{ value: 'id', label: 'name', children: 'subs' }"
    placeholder="自定义字段名"
  />
</template>
