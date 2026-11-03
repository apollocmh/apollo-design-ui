<script setup lang="ts">
// 对齐 antd 的 replace demo：用 `replaceState` 而不是 `pushState`。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-replace-a', title: 'Section A' },
  { key: 'b', href: '#anchor-replace-b', title: 'Section B' },
];
const scrollArea = ref<HTMLElement | null>(null);
const getContainer = () => scrollArea.value;
</script>

<template>
  <div style="display: flex; gap: 16px; min-width: 0">
    <Anchor replace :items="items" :affix="false" :get-container="getContainer" />
    <div ref="scrollArea" style="flex: 1; min-width: 0; height: 240px; overflow: auto" tabindex="0" aria-label="Anchor scroll content">
      <section v-for="id in ['a', 'b']" :id="`anchor-replace-${id}`" :key="id" style="height: 200px; margin-bottom: 16px; padding: 12px; background: var(--apollo-color-fill-alter)">Section {{ id.toUpperCase() }}</section>
    </div>
  </div>
</template>
