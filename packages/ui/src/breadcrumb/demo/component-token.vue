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
  '--apollo-breadcrumb-link-color': '#0958d9',
  '--apollo-breadcrumb-link-hover-color': '#eb2f96',
  '--apollo-breadcrumb-last-item-color': '#531dab',
  '--apollo-breadcrumb-separator-color': '#eb2f96',
  '--apollo-breadcrumb-separator-margin': '12px',
};
</script>

<template>
  <Breadcrumb :items="items" :style="tokenStyle" />
</template>
