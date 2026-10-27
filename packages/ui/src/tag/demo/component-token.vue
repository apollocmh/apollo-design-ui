<script setup lang="ts">
import { ConfigProvider, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const alternate = ref(false);
const theme = computed(() => ({
  // A dark solid surface pairs with the explicit light solid foreground.
  token: { green: alternate.value ? '#304b80' : '#155a32' },
  components: {
    Tag: alternate.value
      ? { defaultBg: '#e5e9ff', defaultColor: '#1b2559', solidTextColor: '#ffffff' }
      : { defaultBg: '#fff7e6', defaultColor: '#5c3100', solidTextColor: '#fffbe6' },
  },
}));
</script>
<template>
  <button type="button" @click="alternate = !alternate">Switch component tokens</button>
  <ConfigProvider :theme="theme">
    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-block-start: 8px">
      <Tag>Default</Tag><Tag>Another</Tag><Tag color="blue">Blue</Tag>
      <Tag color="green" variant="solid">Solid</Tag><Tag variant="outlined">Outlined</Tag>
    </div>
  </ConfigProvider>
</template>
