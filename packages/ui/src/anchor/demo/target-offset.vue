<script setup lang="ts">
// 对齐 antd 的 targetOffset demo：滚动落点的偏移（优先于 `offsetTop`）。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A' },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B' },
  { key: 'c', href: '#anchor-demo-c', title: 'Section C' },
];
</script>

<template>
  <div style="display: flex; gap: 16px">
    <Anchor :items="items" :affix="false" :target-offset="60" />
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
