<script setup lang="ts">
// 对齐 antd 的 demo/presuffix.tsx
import { Input } from '@apollo-design/ui';
</script>

<template>
  <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 8px; width: 240px">
    <Input prefix="¥" suffix="RMB" placeholder="prefix & suffix" />
    <Input suffix="%" placeholder="suffix only" />
  </div>
</template>
