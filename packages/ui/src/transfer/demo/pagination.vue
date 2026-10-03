<script setup lang="ts">
// 对齐 antd `pagination.tsx`。
import type { TransferKey } from '@apollo-design/ui';
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 40 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  disabled: i % 4 === 0,
}));

const targetKeys = ref<string[]>(
  mockData.filter((item) => Number(item.key) % 3 > 1).map((item) => item.key),
);
</script>

<template>
  <Transfer
    :data-source="mockData"
    :pagination="{ pageSize: 10 }"
    :target-keys="targetKeys"
    @change="targetKeys = $event.map(String)"
  />
</template>
