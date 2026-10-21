<script setup lang="ts">
import type { AnchorLinkItemProps } from '@apollo-design/ui';
import { Anchor, Select, Space, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const bounds = ref(5);
const activeLink = ref('');
const scrollArea = ref<HTMLElement | null>(null);

const boundsOptions = [
  { value: 0, label: '0 px' },
  { value: 5, label: '5 px（默认）' },
  { value: 20, label: '20 px' },
  { value: 60, label: '60 px' },
];

const sections = [
  { key: 'a', title: 'Section A' },
  { key: 'b', title: 'Section B' },
  { key: 'c', title: 'Section C' },
  { key: 'd', title: 'Section D' },
];

const items: AnchorLinkItemProps[] = sections.map((section) => ({
  key: section.key,
  href: `#anchor-bounds-${section.key}`,
  title: section.title,
}));

function getContainer(): HTMLElement | Window {
  return scrollArea.value ?? window;
}

function onBoundsChange(value: unknown): void {
  bounds.value = Number(value);
}

function onChange(link: string): void {
  activeLink.value = link;
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>bounds</span>
      <Select
        :value="bounds"
        :options="boundsOptions"
        style="width: 140px"
        @change="onBoundsChange"
      />
      <Tag color="blue">{{ bounds }} px</Tag>
      <Tag>当前高亮：{{ activeLink || '无' }}</Tag>
      <Tag>滚动容器内的锚点</Tag>
    </Space>

    <div style="display: flex; gap: 16px">
      <Anchor
        :items="items"
        :affix="false"
        :bounds="bounds"
        :get-container="getContainer"
        :target-offset="8"
        @change="onChange"
      />
      <div ref="scrollArea" class="anchor-bounds-demo-scroll">
        <div
          v-for="section in sections"
          :id="`anchor-bounds-${section.key}`"
          :key="section.key"
          class="anchor-bounds-demo-section"
        >
          Section {{ section.key.toUpperCase() }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.anchor-bounds-demo-scroll {
  flex: 1;
  height: 240px;
  overflow: auto;
  padding-inline: 8px;
  border: 1px solid var(--apollo-color-border);
  border-radius: var(--apollo-border-radius-lg);
}

.anchor-bounds-demo-section {
  height: 180px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--apollo-color-fill-quaternary);
  border-radius: var(--apollo-border-radius);
}
</style>
