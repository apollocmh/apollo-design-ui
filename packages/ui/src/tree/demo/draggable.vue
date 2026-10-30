<script setup lang="ts">
import { Tree } from '@apollo-design/ui';
import { ref, shallowRef } from 'vue';
import type { DataNode, TreeDropEventInfo, TreeKey } from '../interface';

const createData = (): DataNode[] => [
  {
    key: 'a',
    title: '文件夹 A',
    children: [
      { key: 'a1', title: '文件 A1' },
      { key: 'a2', title: '文件 A2' },
    ],
  },
  { key: 'b', title: '文件夹 B', children: [{ key: 'b1', title: '文件 B1' }] },
];
const treeData = shallowRef(createData());
const expandedKeys = ref<TreeKey[]>(['a', 'b']);
const status = ref('拖动节点到文件夹内或节点之间。');

function visit(
  nodes: DataNode[],
  key: TreeKey,
  action: (node: DataNode, index: number, list: DataNode[]) => void,
): boolean {
  for (const [index, node] of nodes.entries()) {
    if (node.key === key) {
      action(node, index, nodes);
      return true;
    }
    if (node.children && visit(node.children, key, action)) return true;
  }
  return false;
}
function clone(nodes: DataNode[]): DataNode[] {
  return nodes.map((node) => ({
    ...node,
    children: node.children ? clone(node.children) : undefined,
  }));
}
function onDrop(_event: DragEvent, info: TreeDropEventInfo) {
  const next = clone(treeData.value);
  let dragged: DataNode | undefined;
  visit(next, info.dragNode.key, (node, index, list) => {
    dragged = node;
    list.splice(index, 1);
  });
  if (!dragged) return;
  const moving = dragged;
  const relativePosition = info.dropPosition - Number(info.node.pos.split('-').at(-1));
  visit(next, info.node.key, (node, index, list) => {
    if (info.dropToGap) list.splice(index + (relativePosition > 0 ? 1 : 0), 0, moving);
    else {
      node.children ??= [];
      node.children.unshift(moving);
    }
  });
  treeData.value = next;
  status.value = `已移动 ${String(moving.title)}；数据顺序已更新。`;
}
</script>

<template>
  <p role="status">{{ status }}</p>
  <Tree v-model:expanded-keys="expandedKeys" draggable block-node :tree-data="treeData" @drop="onDrop" />
</template>
