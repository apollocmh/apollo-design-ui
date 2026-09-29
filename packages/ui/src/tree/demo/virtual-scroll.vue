<script setup lang="ts">
import { Tree } from '@apollo-design/ui';

const treeData: { title: string; key: string; children?: unknown[] }[] = [];
const build = (pre: string, level: number) => {
  if (level < 0) return undefined;
  return [0, 1, 2].map((i) => {
    const key = `${pre}${i}`;
    return { title: `节点 ${key}`, key, children: build(`${key}-`, level - 1) };
  });
};
treeData.push(...(build('0-', 3) as never));
</script>

<template>
  <Tree :tree-data="treeData" :height="234" default-expand-all />
</template>
