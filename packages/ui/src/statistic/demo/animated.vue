<script setup lang="ts">
// 对齐 antd 的 animated demo（components/statistic/demo/animated.tsx）
// ⚠️ antd 用 react-countup 第三方库做数字滚动 —— 我们用自定义 formatter +
//    toLocaleString 演示同一 API 面（formatter 函数形态），差异登记在 README §5。
import { Statistic } from '@apollo-design/ui';

const formatNumber = (value: unknown) => Number(value ?? 0).toLocaleString('en-US');
</script>

<template>
  <div class="demo-statistic-animated">
    <Statistic
      title="Active Users"
      :value="112893"
      :formatter="formatNumber"
      :class-names="{ content: 'demo-statistic-tabular' }"
    />
    <Statistic
      title="Account Balance (CNY)"
      :value="112893"
      :precision="2"
      :formatter="formatNumber"
      :class-names="{ content: 'demo-statistic-tabular' }"
    />
  </div>
</template>

<style scoped>
.demo-statistic-animated {
  display: flex;
  gap: 24px;
}
</style>

<style>
.demo-statistic-tabular {
  font-variant-numeric: tabular-nums;
}
</style>
