<script setup lang="ts">
// addonBefore / addonAfter 已 deprecated，推荐用 Space.Compact + Space.Addon 组合
import { InputNumber, SpaceAddon, SpaceCompact } from '@apollo-design/ui';
import { ref } from 'vue';

const price = ref<number | null>(100);
const weight = ref<number | null>(2.5);
</script>

<template>
  <div
    style="display: flex; flex-direction: column; gap: 12px; width: 340px; font-family: sans-serif"
  >
    <SpaceCompact>
      <SpaceAddon>￥</SpaceAddon>
      <InputNumber v-model:value="price" :min="0" style="width: 150px" />
      <SpaceAddon>RMB</SpaceAddon>
    </SpaceCompact>
    <SpaceCompact>
      <InputNumber v-model:value="weight" :min="0" :step="0.5" style="width: 150px" />
      <SpaceAddon>kg</SpaceAddon>
    </SpaceCompact>
    <div style="font-size: 12px; color: #999">
      价格：{{ price ?? '空' }}；重量：{{ weight ?? '空' }}
    </div>
  </div>
</template>
