<script setup lang="ts">
// 紧凑组合：Input.Group 已 deprecated，推荐使用 Space.Compact
import { Button, Input, InputNumber, SpaceCompact } from '@apollo-design/ui';
import { ref } from 'vue';

const keyword = ref('');
const number = ref<number | null>(1);
const message = ref('尚未提交');

function submit(): void {
  message.value = `提交：${keyword.value || '(空)'} / ${number.value ?? '(空)'}`;
}
</script>

<template>
  <div
    style="display: flex; flex-direction: column; gap: 12px; width: 420px; font-family: sans-serif"
  >
    <SpaceCompact>
      <Input v-model:value="keyword" aria-label="关键词" style="width: 200px" placeholder="关键词" />
      <InputNumber
        v-model:value="number"
        aria-label="数量"
        :min="0"
        :max="10"
        style="width: 100px"
      />
      <Button type="primary" @click="submit">提交</Button>
    </SpaceCompact>
    <SpaceCompact>
      <Input aria-label="另一种紧凑组合" style="width: 300px" placeholder="另一种紧凑组合" />
      <Button>查询</Button>
    </SpaceCompact>
    <div style="font-size: 12px; color: var(--apollo-color-text-secondary)">{{ message }}</div>
  </div>
</template>
