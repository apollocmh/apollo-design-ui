const e=`<script setup lang="ts">
import { Tree } from '@apollo-design/ui';

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    children: [
      {
        title:
          'multiple line title multiple line title multiple line title multiple line title multiple line title',
        key: '0-0-0',
      },
      { title: 'short title', key: '0-0-1' },
    ],
  },
];
<\/script>

<template>
  <Tree :tree-data="treeData" default-expand-all block-node />
</template>
`;export{e as default};
