<script setup lang="ts">
import { Button, InputNumber } from '@apollo-design/ui';
import { ref } from 'vue';

const custom = ref(true);
</script>

<template>
  <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px">
    <Button @click="custom = !custom">切换模板前后缀 / Toggle slots</Button>
    <InputNumber prefix="$" suffix="USD" aria-label="金额 / Amount" style="width: 200px">
      <template v-if="custom" #prefix><strong>¥</strong></template>
      <template v-if="custom" #suffix><span>元 / CNY</span></template>
    </InputNumber>
    <InputNumber suffix="%" aria-label="百分比 / Percentage" style="width: 200px" />
  </div>
</template>
