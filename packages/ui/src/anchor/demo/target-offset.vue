<script setup lang="ts">
// 对齐 antd 的 targetOffset demo：滚动落点的偏移（优先于 `offsetTop`）。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-target-offset-a', title: 'Section A' },
  { key: 'b', href: '#anchor-target-offset-b', title: 'Section B' },
  { key: 'c', href: '#anchor-target-offset-c', title: 'Section C' },
];
const scrollArea = ref<HTMLElement | null>(null);
const getContainer = () => scrollArea.value;
</script>

<template>
  <div style="display: flex; gap: 16px">
    <Anchor :items="items" :affix="false" :get-container="getContainer" :target-offset="60" />
    <div ref="scrollArea" style="flex: 1; min-width: 0; height: 240px; overflow: auto" tabindex="0" aria-label="Anchor scroll content">
      <div
        v-for="id in ['a', 'b', 'c']"
        :id="`anchor-target-offset-${id}`"
        :key="id"
        style="height: 200px; margin-bottom: 16px; background: var(--apollo-color-fill-alter); color: var(--apollo-color-text); padding: 8px"
      >
        Section {{ id.toUpperCase() }}
      </div>
    </div>
  </div>
</template>
