<script setup lang="ts">
// 组件 Token：在根元素覆写 `--apollo-breadcrumb-*` 变量。
import type { BreadcrumbItemInput } from '@apollo-design/ui';
import { Breadcrumb } from '@apollo-design/ui';
import { h } from 'vue';

const items: BreadcrumbItemInput[] = [
  { title: h('a', { href: '' }, 'Home') },
  { title: h('a', { href: '' }, 'Application Center') },
  { title: 'Application List' },
];

const tokenStyle = {
  '--apollo-breadcrumb-link-color': 'var(--apollo-color-text-secondary)',
  '--apollo-breadcrumb-link-hover-color': 'var(--apollo-color-text)',
  '--apollo-breadcrumb-last-item-color': 'var(--apollo-color-text)',
  '--apollo-breadcrumb-separator-color': 'var(--apollo-color-text-secondary)',
  '--apollo-breadcrumb-separator-margin': '12px',
};
</script>

<template>
  <Breadcrumb :items="items" :style="tokenStyle" />
</template>
