<script setup lang="ts">
import { ConfigProvider, Radio } from '@apollo-design/ui';

const options = [
  { value: 1, label: 'A' },
  { value: 2, label: 'B' },
  { value: 3, label: 'C' },
  { value: 4, label: 'D' },
];
</script>

<template>
  <ConfigProvider :theme="{ token: { wireframe: true } }">
    <Radio.Group :value="1" :options="options" aria-label="Wireframe" />
    <br />
    <Radio.Group :value="1" :options="options" disabled aria-label="Disabled wireframe" />
  </ConfigProvider>
</template>
