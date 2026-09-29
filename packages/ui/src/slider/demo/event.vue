<script setup lang="ts">
// 对齐 antd `event.tsx`：三条事件链 —— beforeChange（开始）→ change（每次变化）→
// changeComplete（拖拽/键盘结束）。⚠️ `change` 的载荷：单把手是数字、range 是数组。
import { Slider, type SliderValue } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<SliderValue>([20, 60]);
const log = ref<string[]>([]);
const push = (tag: string, payload: SliderValue): void => {
  log.value = [`${tag}: ${JSON.stringify(payload)}`, ...log.value].slice(0, 5);
};
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Slider
      v-model:value="value"
      range
      @before-change="(v: SliderValue) => push('beforeChange', v)"
      @change="(v: SliderValue) => push('change', v)"
      @change-complete="(v: SliderValue) => push('changeComplete', v)"
    />
    <pre style="margin: 0">{{ log.join('\n') }}</pre>
  </div>
</template>
