<script setup lang="ts">
// 对齐 antd 的 style-class demo：用 classNames / styles 定制面板、表头与条目。
import type { TransferKey } from '@apollo-design/ui';
import { Transfer } from '@apollo-design/ui';
import { ref } from 'vue';

const dataSource = Array.from({ length: 6 }, (_, index) => ({
  key: String(index),
  title: `Item ${index + 1}`,
  description: `Description ${index + 1}`,
}));

const targetKeys = ref<string[]>(['2']);

const handleChange = (nextTargetKeys: TransferKey[]) => {
  targetKeys.value = nextTargetKeys.map(String);
};

const classNames = {
  section: 'demo-transfer-style-section',
  header: 'demo-transfer-style-header',
  item: 'demo-transfer-style-item',
  actions: 'demo-transfer-style-actions',
};

const styles = {
  header: { color: '#1677ff', fontWeight: '600' },
  item: { fontStyle: 'italic' },
};
</script>

<template>
  <div class="demo-transfer-style-root">
    <Transfer
      :data-source="dataSource"
      :target-keys="targetKeys"
      :titles="['Source', 'Target']"
      :class-names="classNames"
      :styles="styles"
      @change="handleChange"
    />
  </div>
</template>

<style>
.demo-transfer-style-root .demo-transfer-style-section {
  border-color: #91caff;
  border-radius: 12px;
}

.demo-transfer-style-root .demo-transfer-style-header {
  letter-spacing: 0.04em;
}

.demo-transfer-style-root .demo-transfer-style-item {
  color: #531dab;
}

.demo-transfer-style-root .demo-transfer-style-actions {
  gap: 12px;
}
</style>
