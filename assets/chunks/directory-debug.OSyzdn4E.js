const e=`<script setup lang="ts">
import { DirectoryTree } from '@apollo-design/ui';

const treeData = [
  {
    title: 'parent 0',
    key: '0-0',
    children: [
      { title: 'leaf 0-0', key: '0-0-0', isLeaf: true },
      { title: 'leaf 0-1', key: '0-0-1', isLeaf: true },
    ],
  },
];
<\/script>

<template>
  <DirectoryTree :tree-data="treeData" default-expand-all />
</template>
`;export{e as default};
