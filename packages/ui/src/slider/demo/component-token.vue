<script setup lang="ts">
// 当前子树的 Slider Token 通过 ConfigProvider 进入实际根变量。
import { ConfigProvider, Slider } from '@apollo-design/ui';

const marks = { 0: '0°C', 26: '26°C', 37: '37°C', 100: '100°C' };
</script>

<template>
  <ConfigProvider :theme="{ components: { Slider: {
    controlSize: 14, railSize: 6, handleSize: 14, handleSizeHover: 18,
    railBg: '#f0f5ff', railHoverBg: '#e6f4ff', trackBg: '#722ed1', trackHoverBg: '#9254de',
    handleColor: '#722ed1', handleActiveColor: '#531dab', dotBorderColor: '#d3adf7', dotActiveBorderColor: '#722ed1',
  } } }">
    <div style="display: flex; flex-direction: column; gap: 32px; max-width: 480px">
      <Slider :default-value="30" :aria-label-for-handle="'Customized slider'" />
      <Slider
        range
        :default-value="[20, 60]"
        :marks="marks"
        :aria-label-for-handle="['Lower bound', 'Upper bound']"
      />
    </div>
  </ConfigProvider>
</template>
