const n=`<script setup lang="ts">
// 对齐 antd 的 basic demo。⚠️ antd 用 \`<div>\` 做锚点目标 + 固定高度容器；
// 本仓同样用原生元素（demo 不引入未落地的组件）。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A' },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B' },
  { key: 'c', href: '#anchor-demo-c', title: 'Section C' },
];
<\/script>

<template>
  <div style="display: flex; gap: 16px">
    <Anchor :items="items" :affix="false" />
    <div style="flex: 1; height: 240px; overflow: auto">
      <div
        v-for="id in ['a', 'b', 'c']"
        :id="\`anchor-demo-\${id}\`"
        :key="id"
        style="height: 200px; margin-bottom: 16px; background: #f5f5f5; padding: 8px"
      >
        Section {{ id.toUpperCase() }}
      </div>
    </div>
  </div>
</template>
`;export{n as default};
