<script setup lang="ts">
// 对齐 antd 的 demo/digit.tsx：高精度小数（stringMode）

import { InputNumber } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string | null>('1024');
const precisionValue = ref<number | null>(2.9);
</script>

<template>
  <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 8px">
    <InputNumber v-model:value="value" string-mode :step="1" style="width: 200px" />
    <InputNumber v-model:value="precisionValue" :step="0.1" :min="0" :max="10" style="width: 200px" />
  </div>
</template>
