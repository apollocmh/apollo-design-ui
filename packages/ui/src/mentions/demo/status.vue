<script setup lang="ts">
// 对齐 antd demo/status.tsx
import { Mentions, Space } from '@apollo-design/ui';

const options = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
  { value: 'yesmeck', label: 'yesmeck' },
];
</script>

<template>
  <Space vertical>
    <Mentions default-value="@afc163" status="error" :options="options" />
    <Mentions default-value="@afc163" status="warning" :options="options" />
  </Space>
</template>
