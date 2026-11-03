<script setup lang="ts">
// 对齐 antd 的 onClick demo：点击链接的回调（**自定义签名**，不是 DOM 事件）。
// ⚠️ 在回调里 `preventDefault()` 可以让组件**不接管 history**。
import { Anchor, type AnchorLinkInfo, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-onclick-a', title: 'Section A' },
  { key: 'b', href: '#anchor-onclick-b', title: 'Section B' },
];

const clicked = ref('');

const handleClick = (e: MouseEvent, link: AnchorLinkInfo): void => {
  clicked.value = `${link.href}`;
  // 这里**不** preventDefault ⇒ 组件照常接管 history
  void e;
};
const scrollArea = ref<HTMLElement | null>(null);
const getContainer = () => scrollArea.value;
</script>

<template>
  <div>
    <div style="margin-bottom: 8px">最近点击：{{ clicked || '（无）' }}</div>
    <div style="display: flex; gap: 16px; min-width: 0">
    <Anchor :items="items" :affix="false" :get-container="getContainer" @click="handleClick" />
    <div ref="scrollArea" style="flex: 1; min-width: 0; height: 240px; overflow: auto" tabindex="0" aria-label="Anchor scroll content">
      <section v-for="id in ['a', 'b']" :id="`anchor-onclick-${id}`" :key="id" style="height: 200px; margin-bottom: 16px; padding: 12px; background: var(--apollo-color-fill-alter)">Section {{ id.toUpperCase() }}</section>
    </div>
  </div>
  </div>
</template>
