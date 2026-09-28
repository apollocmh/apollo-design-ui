<script setup lang="ts">
// 对齐 antd demo/circle-micro.tsx（≤20px：indicator 经 Tooltip 展示）
import { Flex, Progress } from '@apollo-design/ui';
</script>

<template>
  <Flex align="center" gap="small">
    <Progress
      type="circle"
      rail-color="#e6f4ff"
      :percent="60"
      :stroke-width="20"
      :size="14"
      :format="(n?: number) => `In progress, ${n}% complete`"
    />
    <span>Code release</span>
  </Flex>
</template>
