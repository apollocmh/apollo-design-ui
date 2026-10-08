const e=`<script setup lang="ts">
// 对齐 antd 的 dynamic demo。
// ⚠️ 两处类型要点：①\`treeData\` 用公开的 \`DataNode\`（别推断成 \`unknown[]\`）；
//    ②\`loadData\` 的签名是 \`(node: EventDataNode) => Promise<unknown>\`。
import { Tree } from '@apollo-design/ui';
import { ref } from 'vue';
// ⚠️ \`DataNode\` / \`EventDataNode\` **不在包根导出**（根 barrel 只导 \`Tree*\` 前缀的类型）
//    ⇒ 从组件的本地模块导入；写成 \`from '@apollo-design/ui'\` 会报 TS2305。
import type { DataNode, EventDataNode } from '../interface';

const initTreeData: DataNode[] = [
  { title: 'Expand to load', key: '0' },
  { title: 'Expand to load', key: '1' },
  { title: 'Tree Node', key: '2', isLeaf: true },
];

const treeData = ref<DataNode[]>(initTreeData);

function updateTreeData(list: DataNode[], key: string | number, children: DataNode[]): DataNode[] {
  return list.map((node) => {
    if (node.key === key) return { ...node, children };
    if (node.children) return { ...node, children: updateTreeData(node.children, key, children) };
    return node;
  });
}

const onLoadData = (treeNode: EventDataNode): Promise<unknown> =>
  new Promise<void>((resolve) => {
    if (treeNode.children) {
      resolve();
      return;
    }
    setTimeout(() => {
      treeData.value = updateTreeData(treeData.value, String(treeNode.key), [
        { title: 'Child Node', key: \`\${String(treeNode.key)}-0\` },
        { title: 'Child Node', key: \`\${String(treeNode.key)}-1\` },
      ]);
      resolve();
    }, 1000);
  });
<\/script>

<template>
  <Tree :load-data="onLoadData" :tree-data="treeData" />
</template>
`;export{e as default};
