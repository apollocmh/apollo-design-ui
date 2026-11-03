<script setup lang="ts">
// 对齐 antd 的 horizontal demo：`direction="horizontal"` ⇒ ink 变成底部横条。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-horizontal-a', title: 'Section A' },
  { key: 'b', href: '#anchor-horizontal-b', title: 'Section B' },
  { key: 'c', href: '#anchor-horizontal-c', title: 'Section C' },
];
const scrollArea = ref<HTMLElement | null>(null);
const getContainer = () => scrollArea.value;
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0">
    <Anchor direction="horizontal" :items="items" :affix="false" :get-container="getContainer" />
    <div ref="scrollArea" style="flex: 0 0 auto; min-width: 0; height: 240px; overflow: auto" tabindex="0" aria-label="Anchor scroll content">
      <section v-for="id in ['a', 'b', 'c']" :id="`anchor-horizontal-${id}`" :key="id" style="height: 200px; margin-bottom: 16px; padding: 12px; background: var(--apollo-color-fill-alter)">Section {{ id.toUpperCase() }}</section>
    </div>
  </div>
</template>
