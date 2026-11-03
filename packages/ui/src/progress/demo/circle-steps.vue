<script setup lang="ts">
// Slider 调整分段数量与间距。
import { Flex, Progress, Slider } from '@apollo-design/ui';
import { ref } from 'vue';

const stepsCount = ref<number>(5);
const stepsGap = ref<number>(7);
</script>

<template>
  <div>
    <p>Custom count:</p>
    <Slider v-model:value="stepsCount" :min="2" :max="10" aria-label-for-handle="steps count" />
    <p>Custom gap:</p>
    <Slider v-model:value="stepsGap" :step="4" :min="0" :max="40" aria-label-for-handle="steps gap" />
    <Flex wrap gap="medium" style="margin-top: 16px">
      <Progress
        type="dashboard"
        :steps="8"
        :percent="50"
        rail-color="var(--apollo-color-fill-secondary)"
        :stroke-width="20"
      />
      <Progress
        type="circle"
        :percent="100"
        :steps="{ count: stepsCount, gap: stepsGap }"
        rail-color="var(--apollo-color-fill-secondary)"
        :stroke-width="20"
      />
    </Flex>
  </div>
</template>
