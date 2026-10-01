<script setup lang="ts">
// 对齐 antd 的 withIcon demo。
import { HomeOutlined, UserOutlined } from '@apollo-design/icons';
import { Breadcrumb, type BreadcrumbItemInput } from '@apollo-design/ui';
import { h } from 'vue';

// 第三方图标：直接渲染裸 `<svg>`（没有 `.apollo-icon` 包裹）。
const ChartIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      width: '1em',
      height: '1em',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'aria-hidden': 'true',
    },
    [h('path', { d: 'M3 3v18h18' }), h('path', { d: 'M7 14l4-4 3 3 5-6' })],
  );

const items: BreadcrumbItemInput[] = [
  { href: '', title: h(HomeOutlined) },
  { href: '', title: [h(UserOutlined), h('span', null, 'Application List')] },
  { href: '', title: [h(ChartIcon), h('span', null, 'Dashboard')] },
  { title: 'Application' },
];
</script>

<template>
  <Breadcrumb :items="items" />
</template>
