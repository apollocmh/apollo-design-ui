const e=`<script setup lang="ts">
import { Tree } from '@apollo-design/ui';

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    children: [
      { title: 'leaf 1', key: '0-0-0', isLeaf: true },
      {
        title: 'parent 1-1',
        key: '0-0-1',
        children: [{ title: 'leaf', key: '0-0-1-0', isLeaf: true }],
      },
    ],
  },
];
<\/script>

<template>
  <Tree :tree-data="treeData" default-expand-all show-line />
</template>
`;export{e as default};
