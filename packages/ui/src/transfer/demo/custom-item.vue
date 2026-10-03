<script setup lang="ts">
// 对齐 antd `custom-item.tsx`。
import type { TransferKey } from '@apollo-design/ui';
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  chosen: i % 2 === 0,
}));

const targetKeys = ref<string[]>(mockData.filter((item) => item.chosen).map((item) => item.key));
</script>

<template>
  <Transfer
    :data-source="mockData"
    :target-keys="targetKeys"
    :render="(item) => ({ label: `${item.title}（key: ${item.key}）`, value: String(item.title) })"
    @change="targetKeys = $event.map(String)"
  />
</template>
