<script setup lang="ts">
import type { ThemeConfig } from '@apollo-design/theme';
import { ConfigProvider, Space, Switch } from '@apollo-design/ui';

const theme: ThemeConfig = {
  token: { colorPrimary: 'rgba(25, 118, 210, 0.5)' },
  components: {
    Switch: {
      trackHeight: 14,
      trackMinWidth: 32,
      trackPadding: -3,
      handleSize: 20,
      handleBg: 'rgb(25, 118, 210)',
      handleShadow:
        'rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px, rgba(0, 0, 0, 0.12) 0px 1px 3px 0px',
    },
  },
};
</script>

<template>
  <ConfigProvider :theme="theme">
    <Space>
      <Switch default-checked aria-label="Component token switch" />
    </Space>
  </ConfigProvider>
</template>
