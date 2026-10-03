<script setup lang="ts">
// 对齐 antd `search.tsx`。
import type { TransferKey } from '@apollo-design/ui';
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const mockData = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  description: `description of content${i + 1}`,
}));

const targetKeys = ref<TransferKey[]>(
  mockData.filter((item) => Number(item.key) % 3 > 1).map((item) => item.key),
);

const handleChange = (newTargetKeys: TransferKey[]) => {
  targetKeys.value = newTargetKeys;
};
</script>

<template>
  <Transfer :data-source="mockData" show-search :target-keys="targetKeys" @change="handleChange" />
</template>
