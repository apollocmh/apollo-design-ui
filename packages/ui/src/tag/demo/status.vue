<script setup lang="ts">
// 对齐 antd 的 status demo

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@apollo-design/icons';
import { Tag } from '@apollo-design/ui';
import { h } from 'vue';

const variants = ['filled', 'solid', 'outlined'] as const;
const presets = ['success', 'processing', 'warning', 'error', 'default'];
const iconMap = {
  success: CheckCircleOutlined,
  processing: SyncOutlined,
  warning: ExclamationCircleOutlined,
  error: CloseCircleOutlined,
  default: ClockCircleOutlined,
};
</script>

<template>
  <div v-for="variant in variants" :key="variant">
    <h4>Status ({{ variant }})</h4>
    <Tag v-for="s in presets" :key="s" :color="s" :variant="variant">
      <component :is="h(iconMap[s as keyof typeof iconMap])" />
      {{ s }}
    </Tag>
  </div>
</template>
