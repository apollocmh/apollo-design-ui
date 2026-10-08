const e=`<script setup lang="ts">
import { TreeSelect, type TreeSelectDataNode } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string>();

const build = (pre: string, level: number): TreeSelectDataNode[] | undefined => {
  if (level < 0) return undefined;
  return [0, 1].map((i) => {
    const v = \`\${pre}\${i}\`;
    return { title: \`节点 \${v}\`, value: v, children: build(\`\${v}-\`, level - 1) };
  });
};
const treeData: TreeSelectDataNode[] = build('0-', 3) ?? [];
<\/script>

<template>
  <TreeSelect v-model:value="value" :tree-data="treeData" tree-default-expand-all :list-height="200" placeholder="虚拟滚动" />
</template>
`;export{e as default};
