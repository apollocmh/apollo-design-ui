<script setup lang="ts">
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@apollo-design/icons';
import { Tag } from '@apollo-design/ui';

const variants = ['filled', 'solid', 'outlined'] as const;
const presets = ['success', 'processing', 'warning', 'error', 'default'] as const;
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
    <p>Status ({{ variant }})</p>
    <Tag v-for="s in presets" :key="s" :color="s" :variant="variant">
      <template #icon><component :is="iconMap[s]" aria-hidden="true" /></template>
      {{ s }}
    </Tag>
  </div>
</template>
