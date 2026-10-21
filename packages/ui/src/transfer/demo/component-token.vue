<script setup lang="ts">
// 对齐 antd 的 component-token demo：覆盖列宽、列高、表头高度与条目高度。
import type { TransferKey } from '@apollo-design/ui';
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const dataSource = Array.from({ length: 8 }, (_, index) => ({
  key: String(index),
  title: `Item ${index + 1}`,
  description: `Description ${index + 1}`,
}));

const targetKeys = ref<string[]>(['1', '3']);

const handleChange = (nextTargetKeys: TransferKey[]) => {
  targetKeys.value = nextTargetKeys.map(String);
};
</script>

<template>
  <div class="demo-transfer-token">
    <Transfer
      :data-source="dataSource"
      :target-keys="targetKeys"
      :titles="['Source', 'Target']"
      @change="handleChange"
    />
  </div>
</template>

<style>
.demo-transfer-token .apollo-transfer {
  --apollo-transfer-list-width: 220px;
  --apollo-transfer-list-height: 260px;
  --apollo-transfer-header-height: 48px;
  --apollo-transfer-item-height: 40px;
  --apollo-transfer-item-padding-block: 8px;
}
</style>
