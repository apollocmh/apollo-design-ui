<script setup lang="ts">
// 对齐 antd 的 targetOffset-per-link demo：**每条链接**自己的滚动偏移
// （优先级高于 `Anchor` 的全局 `targetOffset`）。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A', targetOffset: 0 },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B', targetOffset: 120 },
  { key: 'c', href: '#anchor-demo-c', title: 'Section C', targetOffset: 60 },
];
</script>

<template>
  <div style="display: flex; gap: 16px">
    <Anchor :items="items" :affix="false" />
    <div style="flex: 1; height: 240px; overflow: auto">
      <div
        v-for="id in ['a', 'b', 'c']"
        :id="`anchor-demo-${id}`"
        :key="id"
        style="height: 200px; margin-bottom: 16px; background: #f5f5f5; padding: 8px"
      >
        Section {{ id.toUpperCase() }}
      </div>
    </div>
  </div>
</template>
