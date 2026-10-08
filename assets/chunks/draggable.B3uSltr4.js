const n=`<script setup lang="ts">
import { Tree } from '@apollo-design/ui';
import { ref } from 'vue';

const x = 3;
const y = 2;
const z = 1;
const gData = ref([]);
const expandedKeys = ref(['0-0', '0-0-0', '0-0-0-0']);

const generateData = (_level: number, preKey = '0', tns: unknown[] = gData.value) => {
  const children: string[] = [];
  for (let i = 0; i < x; i++) {
    const key = \`\${preKey}-\${i}\`;
    tns.push({ title: key, key });
    if (i < y) children.push(key);
  }
  if (_level < 0) return;
  const level = _level - 1;
  children.forEach((key, index) => {
    (tns[index] as { children: unknown[] }).children = [];
    generateData(level, key, (tns[index] as { children: unknown[] }).children);
  });
};
generateData(z);

const onDragEnter = (info: { expandedKeys?: unknown }) => {
  console.log(info);
};
<\/script>

<template>
  <Tree :expanded-keys="expandedKeys" draggable block-node :tree-data="gData" @drag-enter="onDragEnter" />
</template>
`;export{n as default};
