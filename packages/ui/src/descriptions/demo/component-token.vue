<script setup lang="ts">
// 组件 Token：在根元素覆写 `--apollo-descriptions-*` 变量。
import type { DescriptionsItemType } from '@apollo-design/ui';
import { Descriptions } from '@apollo-design/ui';

const items: DescriptionsItemType[] = [
  { key: '1', label: 'Product', children: 'Cloud Database' },
  { key: '2', label: 'Billing', children: 'Prepaid' },
  { key: '3', label: 'Time', children: '18:00:00' },
  { key: '4', label: 'Amount', children: '$80.00' },
];

const plainTokenStyle = {
  '--apollo-descriptions-label-color': '#1d39c4',
  '--apollo-descriptions-content-color': '#10239e',
  '--apollo-descriptions-item-padding-bottom': '16px',
  '--apollo-descriptions-item-padding-end': '24px',
};

const borderedTokenStyle = {
  '--apollo-descriptions-label-bg': '#f0f5ff',
  '--apollo-descriptions-item-padding-bottom': '16px',
  '--apollo-descriptions-item-padding-end': '24px',
};
</script>

<template>
  <div class="descriptions-component-token-demo">
    <Descriptions :column="2" :items="items" :style="plainTokenStyle" />
    <Descriptions bordered :column="2" :items="items" :style="borderedTokenStyle" />
  </div>
</template>

<style scoped>
.descriptions-component-token-demo {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
