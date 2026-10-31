<script setup lang="ts">
import type { AnchorLinkItemProps } from '@apollo-design/ui';
import { Anchor, ConfigProvider, Select, Space, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const defaultDensity = { value: 'default', label: '默认', block: 4, inline: 16 };
const densities = [
  { value: 'compact', label: '紧凑', block: 1, inline: 8 },
  defaultDensity,
  { value: 'spacious', label: '宽松', block: 10, inline: 28 },
];

type DensityValue = (typeof densities)[number]['value'];

const density = ref<DensityValue>('default');
const activeLink = ref('');

const currentDensity = computed(
  () => densities.find((item) => item.value === density.value) ?? defaultDensity,
);

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

function getContainer(): HTMLElement | null {
  return scrollArea.value;
}

function onDensityChange(value: unknown): void {
  const selected = densities.find((item) => item.value === value);
  if (selected) density.value = selected.value;
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

    <ConfigProvider :theme="{ components: { Anchor: { linkPaddingBlock: currentDensity.block, linkPaddingInlineStart: currentDensity.inline } } }">
    <div style="display: flex; gap: 16px">
      <Anchor
        class="anchor-token-demo"
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
    </ConfigProvider>
  </div>
</template>

<style>
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
