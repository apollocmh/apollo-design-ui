<script setup lang="ts">
import { Tree } from '@apollo-design/ui';
import { h } from 'vue';

// 生成 4 层 × 2 分叉 = 31+ 节点（虚拟滚动可视区外不渲染）
interface DemoNode {
  title: string;
  key: string;
  children?: DemoNode[];
}
const build = (pre: string, level: number): DemoNode[] | undefined => {
  if (level < 0) return undefined;
  return [0, 1].map((i) => {
    const key = `${pre}${i}`;
    return { title: `节点 ${key}`, key, children: build(`${key}-`, level - 1) };
  });
};
const treeData = build('0-', 4) ?? [];
</script>

<template>
  <Tree :tree-data="build('0-', 4)" :height="234" default-expand-all />
</template>
