const e=`<script setup lang="ts">
import { Tree } from '@apollo-design/ui';
import { ref } from 'vue';

const treeData = [
  {
    title: '0-0',
    key: '0-0',
    children: [
      {
        title: '0-0-0',
        key: '0-0-0',
        children: [
          { title: '0-0-0-0', key: '0-0-0-0' },
          { title: '0-0-0-1', key: '0-0-0-1' },
          { title: '0-0-0-2', key: '0-0-0-2' },
        ],
      },
      {
        title: '0-0-1',
        key: '0-0-1',
        children: [
          { title: '0-0-1-0', key: '0-0-1-0' },
          { title: '0-0-1-1', key: '0-0-1-1' },
          { title: '0-0-1-2', key: '0-0-1-2' },
        ],
      },
      { title: '0-0-2', key: '0-0-2' },
    ],
  },
  {
    title: '0-1',
    key: '0-1',
    children: [
      { title: '0-1-0-0', key: '0-1-0-0' },
      { title: '0-1-0-1', key: '0-1-0-1' },
      { title: '0-1-0-2', key: '0-1-0-2' },
    ],
  },
  { title: '0-2', key: '0-2' },
];

const expandedKeys = ref<(string | number)[]>(['0-0-0', '0-0-1']);
const checkedKeys = ref<(string | number)[]>(['0-0-0']);
const selectedKeys = ref<(string | number)[]>([]);
const autoExpandParent = ref(true);

const onExpand = (keys: (string | number)[]) => {
  // rc 判据：不重置 autoExpandParent，子节点展开后父节点收不起来
  expandedKeys.value = keys;
  autoExpandParent.value = false;
};
<\/script>

<template>
  <Tree
    v-model:checkedKeys="checkedKeys"
    v-model:selectedKeys="selectedKeys"
    checkable
    :expanded-keys="expandedKeys"
    :auto-expand-parent="autoExpandParent"
    :tree-data="treeData"
    @expand="onExpand"
  />
</template>
`;export{e as default};
