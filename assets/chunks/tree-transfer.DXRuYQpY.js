const e=`<!--
  tree-transfer：\`renderList\` 通道的树形列表面板（对齐 antd \`demo/tree-transfer.tsx\`）。

  数据是树（父子联动勾选），列表体由 Tree 渲染 —— 通过 \`renderList\` 接管左右两列的
  内容区；\`checkedKeys\` 直接吃 \`selectedKeys\`（每列各自的勾选集），点勾选框经
  \`onItemSelect\` 回写单个 key（antd 官方 demo 同款最简联动）。
-->
<template>
  <Transfer
    v-model:target-keys="targetKeys"
    :data-source="transferDataSource"
    :render-list="renderList"
    :render="renderItem"
    class="tree-transfer"
  />
</template>

<script lang="ts" setup>
import type {
  TransferDirection,
  TransferItem,
  TransferKey,
  TransferListBodyProps,
} from '@apollo-design/ui';
import { Transfer, Tree } from '@apollo-design/ui';
import { h, ref } from 'vue';

interface TreeItem {
  key: string;
  title: string;
  children?: TreeItem[];
}

const treeData: TreeItem[] = [
  { key: '0-0', title: '内容一' },
  {
    key: '0-1',
    title: '内容二',
    children: [
      { key: '0-1-0', title: '内容二一' },
      { key: '0-1-1', title: '内容二二' },
    ],
  },
  { key: '0-2', title: '内容三' },
  { key: '0-3', title: '内容四' },
];

/** Transfer 的 dataSource 是**扁平**的（父子关系由 Tree 自己维护）。 */
const transferDataSource: TransferItem[] = (function flatten(list: TreeItem[]): TreeItem[] {
  return list.flatMap((node) => {
    const { children, ...rest } = node;
    return [rest as TreeItem, ...flatten(children ?? [])];
  });
})(treeData) as unknown as TransferItem[];

const targetKeys = ref<TransferKey[]>([]);

const renderItem = (item: TransferItem) => String(item.title);

type ListPropsWithDirection = TransferListBodyProps & { direction: TransferDirection };

// ⚠️ Transfer 的 renderList prop 声明面是 \`(props: Record<string, unknown>) => VNodeChild\`
const renderList = (rawProps: Record<string, unknown>) => {
  const { selectedKeys, onItemSelect } = rawProps as unknown as TransferListBodyProps;
  return h(Tree, {
    class: 'tree-transfer-list',
    checkable: true,
    defaultExpandAll: true,
    treeData: treeData as never,
    // 每列各自的勾选集（Section 按 selectedKeys 传入）
    checkedKeys: selectedKeys,
    'onUpdate:checkedKeys': (keys: TransferKey[]) => {
      // 与 antd 官方 demo 同判：勾选单个节点，经 onItemSelect 逐个回写
      const removed = selectedKeys.filter((k) => !keys.includes(k));
      const added = keys.filter((k) => !selectedKeys.includes(k));
      for (const key of [...removed, ...added]) {
        onItemSelect(key, added.includes(key));
      }
    },
  });
};

void ({} as ListPropsWithDirection);
<\/script>

<style scoped>
.tree-transfer :deep(.tree-transfer-list) {
  padding: 8px;
  width: 100%;
  height: 100%;
}
</style>
`;export{e as default};
