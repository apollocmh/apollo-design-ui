<script setup lang="ts">
// 对齐 antd 的 with-icon demo（含第三方裸 svg 图标对齐判据）

import { AppstoreOutlined, BarsOutlined } from '@apollo-design/icons';
import { Segmented } from '@apollo-design/ui';
import { h } from 'vue';

const CalendarIcon = () =>
  h('svg', {
    viewBox: '0 0 24 24',
    width: '1em',
    height: '1em',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'aria-hidden': 'true',
    innerHTML: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  });

const options = [
  { label: 'List', value: 'List', icon: h(BarsOutlined) },
  { label: 'Kanban', value: 'Kanban', icon: h(AppstoreOutlined) },
  { label: 'Calendar', value: 'Calendar', icon: h(CalendarIcon) },
];
</script>

<template>
  <Segmented :options="options" />
</template>
