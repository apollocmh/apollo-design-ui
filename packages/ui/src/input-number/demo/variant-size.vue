<script setup lang="ts">
// variant 与 size 的组合
import { InputNumber } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<number | null>(6);
</script>

<template>
  <div
    style="display: flex; flex-direction: column; gap: 8px; width: 220px; font-family: sans-serif"
  >
    <InputNumber v-model:value="value" size="large" variant="filled" :min="0" :max="10" />
    <InputNumber v-model:value="value" size="medium" variant="outlined" :min="0" :max="10" />
    <InputNumber v-model:value="value" size="small" variant="borderless" :min="0" :max="10" />
    <InputNumber v-model:value="value" size="middle" variant="underlined" :min="0" :max="10" />
    <div style="font-size: 12px; color: #999">当前值：{{ value ?? '空' }}</div>
  </div>
</template>
