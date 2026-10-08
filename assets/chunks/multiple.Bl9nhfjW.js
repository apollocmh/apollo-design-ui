const e=`<script setup lang="ts">
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref(['0-0-0']);

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
<\/script>

<template>
  <TreeSelect v-model:value="value" multiple :tree-data="treeData" placeholder="请选择" allow-clear />
</template>
`;export{e as default};
