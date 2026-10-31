<script setup lang="ts">
// 对齐 antd 的 static demo：affix=false，锚点随文档流排列、不固钉。
import { Anchor, type AnchorLinkItemProps } from '@apollo-design/ui';
import { ref } from 'vue';

const items: AnchorLinkItemProps[] = [
  { key: 'basic', href: '#anchor-static-basic', title: 'Basic demo' },
  { key: 'static', href: '#anchor-static-static', title: 'Static demo' },
  {
    key: 'api',
    href: '#anchor-static-api',
    title: 'API',
    children: [
      { key: 'props', href: '#anchor-static-props', title: 'Anchor Props' },
      { key: 'link-props', href: '#anchor-static-link-props', title: 'Link Props' },
    ],
  },
];

const sections = [
  { id: 'basic', title: 'Basic demo' },
  { id: 'static', title: 'Static demo' },
  { id: 'api', title: 'API' },
  { id: 'props', title: 'Anchor Props' },
  { id: 'link-props', title: 'Link Props' },
];

const scrollArea = ref<HTMLElement | null>(null);

const getContainer = (): HTMLElement | null => scrollArea.value;
</script>

<template>
  <div style="display: flex; gap: 16px">
    <Anchor
      :items="items"
      :affix="false"
      :get-container="getContainer"
      :target-offset="8"
    />
    <div ref="scrollArea" class="demo-anchor-static-scroll">
      <div
        v-for="section in sections"
        :id="`anchor-static-${section.id}`"
        :key="section.id"
        class="demo-anchor-static-section"
      >
        <h3 style="margin-top: 0">{{ section.title }}</h3>
        <p>静态锚点不会固定在视口上，滚动内容区域时高亮会跟随当前小节。</p>
      </div>
    </div>
  </div>
</template>

<style>
.demo-anchor-static-scroll {
  flex: 1;
  height: 240px;
  overflow: auto;
  padding-inline: 16px;
  border: 1px solid var(--apollo-color-border);
  border-radius: var(--apollo-border-radius-lg);
}

.demo-anchor-static-section {
  height: 180px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--apollo-color-fill-quaternary);
  border-radius: var(--apollo-border-radius);
}
</style>
