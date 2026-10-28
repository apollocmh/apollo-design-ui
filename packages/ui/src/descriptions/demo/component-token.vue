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

const tokenStyle = {
  backgroundColor: '#fff',
  padding: '12px',
  '--apollo-descriptions-label-bg': '#f0f5ff',
  '--apollo-descriptions-label-color': '#1d39c4',
  '--apollo-descriptions-title-color': '#10239e',
  '--apollo-descriptions-title-margin-bottom': '24px',
  '--apollo-descriptions-content-color': '#10239e',
  '--apollo-descriptions-extra-color': '#1d39c4',
  '--apollo-descriptions-item-padding-bottom': '12px',
  '--apollo-descriptions-item-padding-end': '24px',
  '--apollo-descriptions-colon-margin-left': '6px',
  '--apollo-descriptions-colon-margin-right': '10px',
};
</script>

<template>
  <div class="descriptions-component-token-demo">
    <Descriptions title="Plain palette" :column="2" :items="items" :style="tokenStyle"><template #extra>Custom palette</template></Descriptions>
    <Descriptions title="Bordered palette" bordered :column="2" :items="items" :style="tokenStyle"><template #extra>Custom palette</template></Descriptions>
  </div>
</template>

<style scoped>
.descriptions-component-token-demo {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
