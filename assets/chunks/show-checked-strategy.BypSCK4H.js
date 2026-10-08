const e=`<script setup lang="ts">
import { TreeSelect } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref(['0-0-0', '0-0-1']);

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
<\/script>

<template>
  <div style="display: flex; flex-direction: column; row-gap: 12px">
    <TreeSelect v-model:value="value" tree-checkable show-checked-strategy="SHOW_PARENT" :tree-data="treeData" placeholder="SHOW_PARENT" />
    <TreeSelect v-model:value="value" tree-checkable show-checked-strategy="SHOW_ALL" :tree-data="treeData" placeholder="SHOW_ALL" />
  </div>
</template>
`;export{e as default};
