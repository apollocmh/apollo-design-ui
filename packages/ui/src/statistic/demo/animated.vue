<script setup lang="ts">
import { Statistic } from '@apollo-design/ui';

const formatNumber = (value: number | string, digits = 0) =>
  Number(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
</script>

<template>
  <div class="demo-statistic-animated">
    <Statistic title="Active Users" :value="112893" :class-names="{ content: 'demo-statistic-tabular' }">
      <template #value="{ value }">{{ formatNumber(value) }}</template>
    </Statistic>
    <Statistic title="Account Balance (CNY)" :value="112893" :class-names="{ content: 'demo-statistic-tabular' }">
      <template #value="{ value }">{{ formatNumber(value, 2) }}</template>
    </Statistic>
  </div>
</template>

<style scoped>
.demo-statistic-animated { display: flex; flex-wrap: wrap; gap: 24px; }
</style>
<style>
.demo-statistic-tabular { font-variant-numeric: tabular-nums; }
</style>
