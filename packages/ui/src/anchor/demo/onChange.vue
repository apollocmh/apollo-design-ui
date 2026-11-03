<script setup lang="ts">
// 对齐 antd 的 onChange demo：滚动时回调**当前锚点**。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-onchange-a', title: 'Section A' },
  { key: 'b', href: '#anchor-onchange-b', title: 'Section B' },
  { key: 'c', href: '#anchor-onchange-c', title: 'Section C' },
];

const current = ref('');
const scrollArea = ref<HTMLElement | null>(null);
const getContainer = () => scrollArea.value;
</script>

<template>
  <div>
    <div style="margin-bottom: 8px">当前锚点：{{ current || '（无）' }}</div>
    <div style="display: flex; gap: 16px">
      <Anchor :items="items" :affix="false" :get-container="getContainer" @change="(link: string) => (current = link)" />
      <div ref="scrollArea" style="flex: 1; min-width: 0; height: 240px; overflow: auto" tabindex="0" aria-label="Anchor scroll content">
        <div
          v-for="id in ['a', 'b', 'c']"
          :id="`anchor-onchange-${id}`"
          :key="id"
          style="height: 200px; margin-bottom: 16px; background: var(--apollo-color-fill-alter); color: var(--apollo-color-text); padding: 8px"
        >
          Section {{ id.toUpperCase() }}
        </div>
      </div>
    </div>
  </div>
</template>
