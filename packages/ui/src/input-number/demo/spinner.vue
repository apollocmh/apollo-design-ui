<script setup lang="ts">
// 对齐 antd 的 demo/spinner.tsx：拨轮形态
import { InputNumber } from '@apollo-design/ui';
</script>

<template>
  <div style="font-family: sans-serif">
    <InputNumber mode="spinner" :min="0" :max="10" :value="3" style="width: 120px" />
  </div>
</template>
