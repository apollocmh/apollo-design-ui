const e=`<script setup lang="ts">
import { CarryOutOutlined, SmileOutlined } from '@apollo-design/icons';
import { Tree } from '@apollo-design/ui';
import { h } from 'vue';

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    icon: () => h(CarryOutOutlined),
    children: [
      { title: 'leaf', key: '0-0-0', icon: () => h(CarryOutOutlined) },
      { title: 'leaf', key: '0-0-1', icon: () => h(SmileOutlined) },
    ],
  },
];
<\/script>

<template>
  <Tree show-line :default-expanded-keys="['0-0-0']" :tree-data="treeData" />
</template>
`;export{e as default};
