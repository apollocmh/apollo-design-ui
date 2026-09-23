<script setup lang="ts">
// 对齐 antd 的 Extra / colon demo
import { Descriptions } from '@apollo-design/ui';

const items = [
  { key: '1', label: 'Product', children: 'Cloud Database' },
  { key: '2', label: 'Billing', children: 'Prepaid' },
  { key: '3', label: 'time', children: '18:00:00' },
];
</script>

<template>
  <Descriptions title="Order Detail" extra="操作按钮" :items="items" :colon="false" />
</template>
