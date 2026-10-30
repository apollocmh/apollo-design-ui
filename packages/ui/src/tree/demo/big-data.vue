<script setup lang="ts">
import { Tree } from '@apollo-design/ui';

// Two roots with nine levels produce 1,022 nodes.
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
const treeData = build('0-', 8) ?? [];
</script>

<template>
  <Tree :tree-data="treeData" :height="234" default-expand-all />
</template>
