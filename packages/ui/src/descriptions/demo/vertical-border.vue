<script setup lang="ts">
// 垂直带边框：`layout="vertical"` + `bordered`，并叠加语义化样式。
import type { DescriptionsItemType } from '@apollo-design/ui';
import { Button, Descriptions } from '@apollo-design/ui';
import { ref } from 'vue';

const bordered = ref(true);

const items: DescriptionsItemType[] = [
  { key: '1', label: 'Product', children: 'Cloud Database' },
  { key: '2', label: 'Billing', children: 'Prepaid' },
  { key: '3', label: 'Time', children: '18:00:00' },
  { key: '4', label: 'Amount', children: '$80.00' },
  { key: '5', label: 'Discount', children: '20%' },
  { key: '6', label: 'Status', children: 'Running' },
];

const classNames = { label: 'demo-descriptions-vertical-label' };
const styles = {
  label: { color: 'var(--apollo-color-text)', fontWeight: 600 },
  content: { color: 'var(--apollo-color-text)' },
};
</script>

<template>
  <Descriptions
    :bordered="bordered"
    layout="vertical"
    :column="3"
    :items="items"
    :class-names="classNames"
    :styles="styles"
  >
    <template #extra>
      <Button size="small" @click="bordered = !bordered">
        {{ bordered ? '隐藏边框' : '显示边框' }}
      </Button>
    </template>
  </Descriptions>
</template>

<style>
.demo-descriptions-vertical-label {
  letter-spacing: 0.02em;
}
</style>
