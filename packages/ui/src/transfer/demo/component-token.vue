<script setup lang="ts">
import type { ThemeConfig } from '@apollo-design/theme';
import type { TransferKey } from '@apollo-design/ui';
import { Button, ConfigProvider, Transfer } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const dataSource = Array.from({ length: 8 }, (_, index) => ({
  key: String(index),
  title: `Item ${index + 1}`,
  description: `Description ${index + 1}`,
}));

const targetKeys = ref<TransferKey[]>(['1', '3']);
const customized = ref(true);
const theme = computed((): ThemeConfig => {
  if (!customized.value) return {};
  return {
    components: {
      Transfer: {
        listWidth: 220,
        listHeight: 260,
        listWidthLG: 280,
        headerHeight: 48,
        itemHeight: 40,
        itemPaddingBlock: 8,
        transferHeaderVerticalPadding: 11,
      },
    },
  };
});
</script>

<template>
  <Button @click="customized = !customized">{{ customized ? 'Restore defaults' : 'Apply tokens' }}</Button>
  <ConfigProvider :theme="theme">
    <Transfer
      :data-source="dataSource"
      v-model:target-keys="targetKeys"
      :titles="['Source', 'Target']"
    />
  </ConfigProvider>
</template>
