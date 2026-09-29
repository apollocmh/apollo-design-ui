<script setup lang="ts">
import { Tree } from '@apollo-design/ui';
import { h } from 'vue';

const treeData = [];
const gen = (keys: string[], level: number): void => {
  keys.forEach((key) => {
    treeData.push({
      title: key,
      key,
      children: level > 0 ? (gen([], level - 1), undefined) : undefined,
    } as never);
    if (level > 0) {
      treeData[treeData.length - 1].children = [];
      gen([`${key}-0`, `${key}-1`], level - 1).forEach((n) =>
        (treeData[treeData.length - 1].children as unknown[]).push(n),
      );
    }
  });
  return keys.forEach(() => {});
};
// 生成 3 层 × 2^3 = 1000+ 节点
const build = (pre: string, level: number): never[] | undefined => {
  if (level < 0) return undefined;
  return [0, 1].map((i) => {
    const key = `${pre}${i}`;
    return { title: `节点 ${key}`, key, children: build(`${key}-`, level - 1) } as never;
  });
};
</script>

<template>
  <Tree :tree-data="build('0-', 4)" :height="234" default-expand-all />
</template>
