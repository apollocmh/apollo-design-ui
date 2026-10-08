const e=`<script setup lang="ts">
import {
  DownOutlined,
  FrownFilled,
  FrownOutlined,
  MehOutlined,
  SmileOutlined,
} from '@apollo-design/icons';
import { Tree } from '@apollo-design/ui';
import { h } from 'vue';

const treeData = [
  {
    title: 'parent 1',
    key: '0-0',
    icon: () => h(SmileOutlined),
    children: [
      { title: 'leaf', key: '0-0-0', icon: () => h(MehOutlined) },
      {
        title: 'leaf',
        key: '0-0-1',
        icon: ({ selected }: { selected?: boolean }) =>
          selected ? h(FrownFilled) : h(FrownOutlined),
      },
    ],
  },
];
<\/script>

<template>
  <Tree show-icon default-expand-all :default-selected-keys="['0-0-0']" :switcher-icon="h(DownOutlined)" :tree-data="treeData" />
</template>
`;export{e as default};
