<script setup lang="ts">
// 用本库的 InputNumber 与 Segmented 调整仪表盘缺口。
import { Flex, InputNumber, Progress, Segmented } from '@apollo-design/ui';
import { ref } from 'vue';

const gapDegree = ref<number>(50);
const gapPlacement = ref<'start' | 'end' | 'top' | 'bottom'>('bottom');
</script>

<template>
  <Flex vertical gap="large">
    <div>
      gapDegree:
      <InputNumber v-model:value="gapDegree" :min="0" :max="360" :step="50" aria-label="gapDegree" style="width: 100px" />
    </div>
    <div>
      gapPlacement:
      <Segmented :value="gapPlacement" :options="['start', 'end', 'top', 'bottom']" aria-label="gapPlacement" @update:value="next => { if (next === 'start' || next === 'end' || next === 'top' || next === 'bottom') gapPlacement = next; }" />
    </div>
    <Progress type="dashboard" :gap-degree="gapDegree" :percent="30" :gap-placement="gapPlacement" />
  </Flex>
</template>
