<script setup lang="ts">
// 对齐 antd demo/circle-steps.tsx（antd 用 Slider —— 本仓未落地，InputNumber 等价替换，
// slider 落地后换回；README §2 登记）
import { Flex, InputNumber, Progress } from '@apollo-design/ui';
import { ref } from 'vue';

const stepsCount = ref<number>(5);
const stepsGap = ref<number>(7);
</script>

<template>
  <div>
    <p>Custom count:</p>
    <InputNumber v-model:value="stepsCount" :min="2" :max="10" aria-label="steps count" />
    <p>Custom gap:</p>
    <InputNumber v-model:value="stepsGap" :step="4" :min="0" :max="40" aria-label="steps gap" />
    <Flex wrap gap="medium" style="margin-top: 16px">
      <Progress
        type="dashboard"
        :steps="8"
        :percent="50"
        rail-color="rgba(0, 0, 0, 0.06)"
        :stroke-width="20"
      />
      <Progress
        type="circle"
        :percent="100"
        :steps="{ count: stepsCount, gap: stepsGap }"
        rail-color="rgba(0, 0, 0, 0.06)"
        :stroke-width="20"
      />
    </Flex>
  </div>
</template>
