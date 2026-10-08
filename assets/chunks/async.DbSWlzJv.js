const e=`<script setup lang="ts">
import { TreeSelect, type TreeSelectDataNode } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string>();
const treeData = ref<TreeSelectDataNode[]>([{ title: 'Expand to load', value: '0' }]);

const onLoadData = (treeNode: TreeSelectDataNode) =>
  new Promise<void>((resolve) => {
    if (treeNode.children) {
      resolve();
      return;
    }
    setTimeout(() => {
      treeData.value = [
        {
          title: 'Expand to load',
          value: '0',
          children: [{ title: 'Child Node', value: \`\${treeNode.value}-0\` }],
        },
      ];
      resolve();
    }, 500);
  });
<\/script>

<template>
  <TreeSelect v-model:value="value" :load-data="onLoadData" :tree-data="treeData" placeholder="请选择" />
</template>
`;export{e as default};
