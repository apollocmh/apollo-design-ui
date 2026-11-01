<script setup lang="ts">
// 对齐 antd 的 colorful demo
import { Space, Tag } from '@apollo-design/ui';

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
    <p>Presets ({{ variant }})</p>
    <Space wrap :size="[8, 8]">
      <Tag v-for="p in presets" :key="p" :color="p" :variant="variant">{{ p }}</Tag>
    </Space>
    <p>Status ({{ variant }})</p>
    <Space wrap :size="[8, 8]">
      <Tag v-for="s in status" :key="s" :color="s" :variant="variant">{{ s }}</Tag>
    </Space>
    <p>Custom ({{ variant }})</p>
    <Space wrap :size="[8, 8]">
      <Tag v-for="c in customs" :key="c" :color="c" :variant="variant">{{ c }}</Tag>
    </Space>
  </div>
</template>
