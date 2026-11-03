<script setup lang="ts">
// 对齐 antd 的 targetOffset-per-link demo：**每条链接**自己的滚动偏移
// （优先级高于 `Anchor` 的全局 `targetOffset`）。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-target-offset-per-link-a', title: 'Section A', targetOffset: 0 },
  { key: 'b', href: '#anchor-target-offset-per-link-b', title: 'Section B', targetOffset: 120 },
  { key: 'c', href: '#anchor-target-offset-per-link-c', title: 'Section C', targetOffset: 60 },
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
        :id="`anchor-target-offset-per-link-${id}`"
        :key="id"
        style="height: 200px; margin-bottom: 16px; background: var(--apollo-color-fill-alter); color: var(--apollo-color-text); padding: 8px"
      >
        Section {{ id.toUpperCase() }}
      </div>
    </div>
  </div>
</template>
