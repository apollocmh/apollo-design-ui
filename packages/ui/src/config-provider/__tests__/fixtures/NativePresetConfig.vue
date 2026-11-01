<script setup lang="ts">
import type { ThemeConfig, ThemePreset } from '@apollo-design/theme';
import { monoPreset } from '@apollo-design/theme/presets/mono';
import { shallowRef } from 'vue';
import ConfigProvider from '../../ConfigProvider';

const custom: ThemePreset = { name: 'Brand', light: { token: { colorPrimary: '#225577' } } };
const theme = shallowRef<ThemeConfig>({ preset: monoPreset, mode: 'system' });
function change() {
  theme.value = { preset: custom, mode: 'dark', token: { colorPrimaryBg: '#112233' } };
}
</script>

<template>
  <ConfigProvider :theme="theme">
    <button @click="change">Switch theme without replacing this element</button>
  </ConfigProvider>
  <!-- @vue-expect-error Named presets must be imported objects, not registry strings. -->
  <ConfigProvider :theme="{ preset: 'mono' }" />
  <!-- @vue-expect-error A preset does not turn the mode into an arbitrary theme name. -->
  <ConfigProvider :theme="{ preset: monoPreset, mode: 'compact' }" />
  <!-- @vue-expect-error User seed typography retains its numeric type. -->
  <ConfigProvider :theme="{ preset: custom, token: { fontSize: '16px' } }" />
</template>
