<script setup lang="ts">
// ⚠️ `TreeRef` 是组件的**公开类型**（`tree/interface.ts` 定义、包根导出），
//    不是 `use-tree` 的导出 —— 原来从 '../use-tree' import 会报 TS2305。
import { Button, Tree, type TreeRef } from '@apollo-design/ui';
import { ref } from 'vue';
import type { DataNode } from '../interface';
import { useTree } from '../use-tree';

const TARGET_KEY = '0-0-0-1-1';
const treeRef = ref<TreeRef | null>(null);

const treeData: DataNode[] = [
  {
    title: 'parent 0',
    key: '0-0',
    children: [
      {
        title: 'parent 0-0',
        key: '0-0-0',
        children: [
          {
            title: 'parent 0-0-0',
            key: '0-0-0-0',
            children: [
              { title: 'leaf 0-0-0-0-0', key: '0-0-0-0-0', isLeaf: true },
              { title: 'leaf 0-0-0-0-1', key: '0-0-0-0-1', isLeaf: true },
            ],
          },
        ],
      },
    ],
  },
];

const expandedKeys = ref<(string | number)[]>([]);
const { getPath } = useTree(() => treeData, {});

const scrollTo = () => {
  expandedKeys.value = getPath(TARGET_KEY).map(({ key }) => key);
  treeRef.value?.scrollTo({ key: TARGET_KEY, align: 'top' });
};
</script>

<template>
  <div style="display: flex; flex-direction: column; row-gap: 8px">
    <Button @click="scrollTo">scrollTo: {{ TARGET_KEY }}</Button>
    <Tree
      ref="treeRef"
      :height="200"
      :tree-data="treeData"
      :expanded-keys="expandedKeys"
      @expand="(keys: (string | number)[]) => (expandedKeys = keys)"
    />
  </div>
</template>
