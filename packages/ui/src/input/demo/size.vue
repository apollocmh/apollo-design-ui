<script setup lang="ts">
// 对齐 antd 的 demo/size.tsx
import { Input } from '@apollo-design/ui';
</script>

<template>
  <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 8px; width: 240px">
    <Input placeholder="large" size="large" />
    <Input placeholder="default" />
    <Input placeholder="small" size="small" />
  </div>
</template>
