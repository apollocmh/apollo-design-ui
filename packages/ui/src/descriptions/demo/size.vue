<script setup lang="ts">
// 对齐 antd 的 size demo（⚠️ 'default' 已废弃，提示改 'large'）
import { Descriptions } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'Product', children: 'Cloud Database' },
  { key: '2', label: 'Billing', children: 'Prepaid' },
  { key: '3', label: 'time', children: '18:00:00' },
];
</script>

<template>
  <Descriptions size="small" title="Small" :items="items" style="margin-bottom: 24px" />
  <Descriptions size="medium" title="Medium（默认）" :items="items" style="margin-bottom: 24px" />
  <Descriptions title="Large" :items="items" />
</template>
