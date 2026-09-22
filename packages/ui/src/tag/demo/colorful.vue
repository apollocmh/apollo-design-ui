<script setup lang="ts">
// 对齐 antd 的 colorful demo
import { Tag } from '@apollo-design/ui';

const variants = ['filled', 'solid', 'outlined'] as const;
const presets = [
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
];
const status = ['success', 'processing', 'error', 'warning', 'default'];
const customs = ['#f50', '#2db7f5', '#87d068', '#108ee9'];
</script>

<template>
  <div v-for="variant in variants" :key="variant">
    <h4>Presets ({{ variant }})</h4>
    <Tag v-for="p in presets" :key="p" :color="p" :variant="variant">{{ p }}</Tag>
    <h4>Status ({{ variant }})</h4>
    <Tag v-for="s in status" :key="s" :color="s" :variant="variant">{{ s }}</Tag>
    <h4>Custom ({{ variant }})</h4>
    <Tag v-for="c in customs" :key="c" :color="c" :variant="variant">{{ c }}</Tag>
  </div>
</template>
