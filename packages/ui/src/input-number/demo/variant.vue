<script setup lang="ts">
// 对齐 antd 的 demo/variant.tsx：形态变体
import { InputNumber } from '@apollo-design/ui';
</script>

<template>
  <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 8px">
    <InputNumber placeholder="outlined" variant="outlined" style="width: 200px" />
    <InputNumber placeholder="filled" variant="filled" style="width: 200px" />
    <InputNumber placeholder="borderless" variant="borderless" style="width: 200px" />
    <InputNumber placeholder="underlined" variant="underlined" style="width: 200px" />
  </div>
</template>
