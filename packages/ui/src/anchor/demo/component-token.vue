<script setup lang="ts">
import type { AnchorLinkItemProps } from '@apollo-design/ui';
import { Anchor, Select, Space, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const densities = [
  { value: 'compact', label: '紧凑', block: 1, inline: 8 },
  { value: 'default', label: '默认', block: 4, inline: 16 },
  { value: 'spacious', label: '宽松', block: 10, inline: 28 },
];

type DensityValue = (typeof densities)[number]['value'];

const density = ref<DensityValue>('default');
const activeLink = ref('');

const currentDensity = computed(
  () =>
    densities.find((item) => item.value === density.value) ??
    (densities[0] as (typeof densities)[number]),
);

const tokenStyle = computed(() => ({
  '--anchor-demo-padding-block': `${currentDensity.value.block}px`,
  '--anchor-demo-padding-inline-start': `${currentDensity.value.inline}px`,
}));

const sections = [
  { key: 'a', title: 'Section A' },
  { key: 'b', title: 'Section B' },
  { key: 'c', title: 'Section C' },
];

const items: AnchorLinkItemProps[] = sections.map((section) => ({
  key: section.key,
  href: `#anchor-token-${section.key}`,
  title: section.title,
}));

const scrollArea = ref<HTMLElement | null>(null);

function getContainer(): HTMLElement | Window {
  return scrollArea.value ?? window;
}

function onDensityChange(value: unknown): void {
  density.value = value as DensityValue;
}

function onChange(link: string): void {
  activeLink.value = link;
}
</script>

<template>
  <div>
    <Space :size="12" wrap style="margin-bottom: 16px">
      <span>链接内边距</span>
      <Select
        :value="density"
        :options="densities"
        style="width: 140px"
        @change="onDensityChange"
      />
      <Tag color="blue">block: {{ currentDensity.block }}px</Tag>
      <Tag>inline-start: {{ currentDensity.inline }}px</Tag>
      <Tag>当前高亮：{{ activeLink || '无' }}</Tag>
    </Space>

    <div style="display: flex; gap: 16px">
      <Anchor
        class="anchor-token-demo"
        :style="tokenStyle"
        :items="items"
        :affix="false"
        :get-container="getContainer"
        :target-offset="8"
        @change="onChange"
      />
      <div ref="scrollArea" class="anchor-token-demo-scroll">
        <div
          v-for="section in sections"
          :id="`anchor-token-${section.key}`"
          :key="section.key"
          class="anchor-token-demo-section"
        >
          Section {{ section.key.toUpperCase() }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.anchor-token-demo .apollo-anchor.apollo-anchor {
  --apollo-anchor-link-padding-block: var(--anchor-demo-padding-block, 4px);
  --apollo-anchor-link-padding-inline-start: var(--anchor-demo-padding-inline-start, 16px);
}

.anchor-token-demo-scroll {
  flex: 1;
  height: 240px;
  overflow: auto;
  padding-inline: 8px;
  border: 1px solid var(--apollo-color-border);
  border-radius: var(--apollo-border-radius-lg);
}

.anchor-token-demo-section {
  height: 180px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--apollo-color-fill-quaternary);
  border-radius: var(--apollo-border-radius);
}
</style>
