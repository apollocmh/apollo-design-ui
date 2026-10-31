<script setup lang="ts">
// 对齐 antd 的 style-class demo：通过 classNames / styles 定制条目标题与指示条。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'a', href: '#anchor-style-class-a', title: 'Section A' },
  { key: 'b', href: '#anchor-style-class-b', title: 'Section B' },
  { key: 'c', href: '#anchor-style-class-c', title: 'Section C' },
];

const classNames = {
  item: 'demo-anchor-style-item',
  itemTitle: 'demo-anchor-style-title',
  indicator: 'demo-anchor-style-indicator',
};

const styles = {
  itemTitle: { letterSpacing: '0.04em' },
};

const scrollArea = ref<HTMLElement | null>(null);

const getContainer = (): HTMLElement | null => scrollArea.value;
</script>

<template>
  <div style="display: flex; gap: 16px">
    <Anchor
      class="demo-anchor-style-root"
      :items="items"
      :affix="false"
      show-ink-in-fixed
      :get-container="getContainer"
      :target-offset="8"
      :class-names="classNames"
      :styles="styles"
    />
    <div ref="scrollArea" class="demo-anchor-style-scroll">
      <div
        v-for="section in ['a', 'b', 'c']"
        :id="`anchor-style-class-${section}`"
        :key="section"
        class="demo-anchor-style-section"
      >
        Section {{ section.toUpperCase() }}
      </div>
    </div>
  </div>
</template>

<style>
.demo-anchor-style-root .demo-anchor-style-title {
  color: #531dab;
  font-weight: 600;
}

.demo-anchor-style-root .demo-anchor-style-item {
  border-radius: 6px;
  transition: background-color 0.3s;
}

.demo-anchor-style-root .demo-anchor-style-item:hover {
  background: #f9f0ff;
}

.demo-anchor-style-root .demo-anchor-style-indicator {
  width: 4px;
  border-radius: 2px;
  background: #722ed1;
}

.demo-anchor-style-scroll {
  flex: 1;
  height: 240px;
  overflow: auto;
  padding-inline: 8px;
  border: 1px solid var(--apollo-color-border);
  border-radius: var(--apollo-border-radius-lg);
}

.demo-anchor-style-section {
  height: 180px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--apollo-color-fill-quaternary);
  border-radius: var(--apollo-border-radius);
}
</style>
