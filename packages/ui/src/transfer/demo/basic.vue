<script setup lang="ts">
import type { TransferKey } from '@apollo-design/ui';
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  description: `description of content${i + 1}`,
  disabled: i % 4 === 0,
}));

const targetKeys = ref<TransferKey[]>(
  mockData.filter((item) => Number(item.key) % 3 > 1).map((item) => item.key),
);
const selectedKeys = ref<TransferKey[]>(['1', '4']);
</script>

<template>
  <Transfer
    :data-source="mockData"
    v-model:target-keys="targetKeys"
    v-model:selected-keys="selectedKeys"
  />
</template>
