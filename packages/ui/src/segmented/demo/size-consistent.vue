<script setup lang="ts">
// 对齐 antd 的 size-consistent demo：Segmented 与同尺寸 Button 高度一致。
import { Button, Segmented } from '@apollo-design/ui';

const options = ['Daily', 'Weekly', 'Monthly'];
</script>

<template>
  <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 12px">
    <div style="display: flex; align-items: center; gap: 12px">
      <Segmented size="large" :options="options" />
      <Button size="large">Large Button</Button>
    </div>
    <div style="display: flex; align-items: center; gap: 12px">
      <Segmented size="middle" :options="options" />
      <Button size="middle">Middle Button</Button>
    </div>
    <div style="display: flex; align-items: center; gap: 12px">
      <Segmented size="small" :options="options" />
      <Button size="small">Small Button</Button>
    </div>
  </div>
</template>
