<script setup lang="ts">
// 对齐 antd 的 customized-color demo
import { BorderBeam } from '@apollo-design/ui';

const stops = [
  { color: '#722ed1', percent: 20 },
  { color: '#2db7f5', percent: 50 },
  { color: '#87d068', percent: 80 },
];
</script>

<template>
  <BorderBeam :color="stops">
    <div style="position: relative; border: 1px solid #ddd; border-radius: 8px; padding: 24px">Gradient</div>
  </BorderBeam>
</template>
