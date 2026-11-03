<script setup lang="ts">
// 对齐 antd 的 customizeHighlight demo：`getCurrentAnchor` **改写高亮**
// （⚠️ 只改高亮，`onChange` 收到的仍是**原始 link**）。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-customize-highlight-a', title: 'Section A' },
  { key: 'b', href: '#anchor-customize-highlight-b', title: 'Section B' },
  { key: 'c', href: '#anchor-customize-highlight-c', title: 'Section C' },
];

/** 永远把 `#anchor-customize-highlight-b` 显示为高亮。 */
const getCurrentAnchor = (): string => '#anchor-customize-highlight-b';
const scrollArea = ref<HTMLElement | null>(null);
const getContainer = () => scrollArea.value;
</script>

<template>
  <div style="display: flex; gap: 16px; min-width: 0">
    <Anchor :items="items" :affix="false" :get-container="getContainer" :get-current-anchor="getCurrentAnchor" />
    <div ref="scrollArea" style="flex: 1; min-width: 0; height: 240px; overflow: auto" tabindex="0" aria-label="Anchor scroll content">
      <section v-for="id in ['a', 'b', 'c']" :id="`anchor-customize-highlight-${id}`" :key="id" style="height: 200px; margin-bottom: 16px; padding: 12px; background: var(--apollo-color-fill-alter)">Section {{ id.toUpperCase() }}</section>
    </div>
  </div>
</template>
