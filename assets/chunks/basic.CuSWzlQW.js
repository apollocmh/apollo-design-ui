const e=`<script setup lang="ts">
import { Tree } from '@apollo-design/ui';

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    children: [
      {
        title: 'parent 1-0',
        key: '0-0-0',
        disabled: true,
        children: [
          { title: 'leaf', key: '0-0-0-0', disableCheckbox: true },
          { title: 'leaf', key: '0-0-0-1' },
        ],
      },
      {
        title: 'parent 1-1',
        key: '0-0-1',
        children: [{ title: 'sss', key: '0-0-1-0', style: { color: '#1677ff' } }],
      },
    ],
  },
];
<\/script>

<template>
  <Tree
    checkable
    :default-expanded-keys="['0-0-0', '0-0-1']"
    :default-selected-keys="['0-0-1']"
    :default-checked-keys="['0-0-0', '0-0-1']"
    :tree-data="treeData"
  />
</template>
`;export{e as default};
