<script setup lang="ts">
import type { ThemeConfig } from '@apollo-design/theme';
import { Card, ConfigProvider } from '@apollo-design/ui';

const tokenStyle = {
  width: '360px',
};
const theme: ThemeConfig = {
  components: {
    Card: {
      headerBg: '#e6f4ff',
      headerFontSize: 18,
      headerPadding: 24,
      bodyPadding: 20,
      actionsBg: '#f0f5ff',
    },
  },
};

const actions = ['Edit', 'More'];
</script>

<template>
  <ConfigProvider :theme="theme">
    <Card
      title="Component token card"
      extra="Extra"
      hoverable
      :actions="actions"
      :style="tokenStyle"
    >
      <p>Card content</p>
      <p>Header, body and actions are styled with card component tokens.</p>
    </Card>
  </ConfigProvider>
</template>
