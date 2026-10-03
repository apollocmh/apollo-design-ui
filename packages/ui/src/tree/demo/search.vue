<script setup lang="ts">
// 对齐 antd 的 search demo。⚠️ 用**公开的 `DataNode`** 标注，别让 TS 推断成
// `children?: unknown[]` —— 那样传给 `:tree-data` 会报「不可赋值给 DataNode[]」。
import { Tree } from '@apollo-design/ui';
import { ref } from 'vue';
// ⚠️ `DataNode` / `EventDataNode` **不在包根导出**（根 barrel 只导 `Tree*` 前缀的类型）
//    ⇒ 从组件的本地模块导入；写成 `from '@apollo-design/ui'` 会报 TS2305。
import type { DataNode, TreeKey } from '../interface';

const x = 3,
  y = 2,
  z = 1;
const defaultData: DataNode[] = [];
const generateData = (_level: number, preKey = '0', tns: DataNode[] = defaultData): void => {
  const children: string[] = [];
  for (let i = 0; i < x; i += 1) {
    const key = `${preKey}-${i}`;
    tns.push({ title: key, key });
    if (i < y) children.push(key);
  }
  if (_level < 0) return;
  const level = _level - 1;
  for (const [index, key] of children.entries()) {
    const node = tns[index];
    if (!node) continue;
    node.children = [];
    generateData(level, key, node.children);
  }
};
generateData(z);

// ⚠️ 节点 key 的类型是公开的 `TreeKey`（`string | number`），不是 `string`。
const dataList: { key: TreeKey; title: string }[] = [];
const generateList = (data: DataNode[]): void => {
  for (const node of data) {
    dataList.push({ key: node.key, title: String(node.key) });
    if (node.children) generateList(node.children);
  }
};
generateList(defaultData);

const getParentKey = (key: TreeKey, tree: DataNode[]): TreeKey | undefined => {
  let parentKey: TreeKey | undefined;
  for (const node of tree) {
    if (!node.children) continue;
    if (node.children.some((item) => item.key === key)) {
      parentKey = node.key;
    } else {
      const nested = getParentKey(key, node.children);
      if (nested) parentKey = nested;
    }
  }
  return parentKey;
};

const expandedKeys = ref<(string | number)[]>([]);
const searchValue = ref('');
const autoExpandParent = ref(true);

const onChange = (e: Event): void => {
  const value = (e.target as HTMLInputElement).value;
  // ⚠️ 去重 + 收紧类型：`filter(Boolean)` 会留下 `undefined`（`(string|undefined)[]`
  //    赋不给 `(string|number)[]`），用 Set + 类型守卫表达同一语义。
  const newExpandedKeys = Array.from(
    new Set(
      dataList
        .map((item) =>
          item.title.includes(value) ? getParentKey(item.key, defaultData) : undefined,
        )
        .filter((item): item is string => item !== undefined),
    ),
  );
  expandedKeys.value = newExpandedKeys;
  searchValue.value = value;
  autoExpandParent.value = true;
};
</script>

<template>
  <div>
    <!-- antd 用 Input.Search（未落地）⇒ 原生 input 等价替换（README §7 登记） -->
    <input class="tree-demo-search" placeholder="Search" @input="onChange" />
    <Tree
      :expanded-keys="expandedKeys"
      :auto-expand-parent="autoExpandParent"
      :tree-data="defaultData"
      @expand="(keys: (string | number)[]) => { expandedKeys = keys; autoExpandParent = false; }"
    />
  </div>
</template>
