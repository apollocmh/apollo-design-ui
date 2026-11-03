<script setup lang="ts">
// 对齐 antd 的 basic demo。⚠️ antd 用 `<div>` 做锚点目标 + 固定高度容器；
// 本仓同样用原生元素（demo 不引入未落地的组件）。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-demo-a', title: 'Section A' },
  { key: 'b', href: '#anchor-demo-b', title: 'Section B' },
  { key: 'c', href: '#anchor-demo-c', title: 'Section C' },
];
const scrollArea = ref<HTMLElement | null>(null);
const getContainer = () => scrollArea.value;
</script>

<template>
  <div style="display: flex; gap: 16px">
    <Anchor :items="items" :affix="false" :get-container="getContainer" />
    <div ref="scrollArea" style="flex: 1; min-width: 0; height: 240px; overflow: auto" tabindex="0" aria-label="Anchor scroll content">
      <div
        v-for="id in ['a', 'b', 'c']"
        :id="`anchor-demo-${id}`"
        :key="id"
        style="height: 200px; margin-bottom: 16px; background: var(--apollo-color-fill-alter); color: var(--apollo-color-text); padding: 8px"
      >
        Section {{ id.toUpperCase() }}
      </div>
    </div>
  </div>
</template>
