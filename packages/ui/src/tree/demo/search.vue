<script setup lang="ts">
import { Tree } from '@apollo-design/ui';
import { ref } from 'vue';

const x = 3,
  y = 2,
  z = 1;
const defaultData: { title: string; key: string; children?: unknown[] }[] = [];
const generateData = (_level: number, preKey = '0', tns = defaultData) => {
  const children: string[] = [];
  for (let i = 0; i < x; i++) {
    const key = `${preKey}-${i}`;
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

const dataList: { key: string; title: string }[] = [];
const generateList = (data: typeof defaultData) => {
  for (const node of data) {
    dataList.push({ key: node.key, title: node.key });
    if (node.children) generateList(node.children as typeof defaultData);
  }
};
generateList(defaultData);

const getParentKey = (key: string, tree: typeof defaultData): string | undefined => {
  let parentKey: string | undefined;
  for (const node of tree) {
    if (node.children) {
      if ((node.children as typeof defaultData).some((item) => item.key === key)) {
        parentKey = node.key;
      } else if (getParentKey(key, node.children as typeof defaultData)) {
        parentKey = getParentKey(key, node.children as typeof defaultData);
      }
    }
  }
  return parentKey;
};

const expandedKeys = ref<(string | number)[]>([]);
const searchValue = ref('');
const autoExpandParent = ref(true);

const onChange = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  const newExpandedKeys = dataList
    .map((item) => (item.title.includes(value) ? getParentKey(item.key, defaultData) : null))
    .filter((item, i, self) => !!(item && self.indexOf(item) === i));
  expandedKeys.value = newExpandedKeys;
  searchValue.value = value;
  autoExpandParent.value = true;
};
</script>

<template>
  <div>
    <!-- antd 用 Input.Search（未落地）⇒ 原生 input 等价替换（README §7 登记） -->
    <input
      class="tree-demo-search"
      placeholder="Search"
      @change="onChange"
    />
    <Tree
      :expanded-keys="expandedKeys"
      :auto-expand-parent="autoExpandParent"
      :tree-data="defaultData"
      @expand="(keys: (string | number)[]) => { expandedKeys = keys; autoExpandParent = false; }"
    />
  </div>
</template>
