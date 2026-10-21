<script setup lang="ts">
// changeOnWheel：聚焦后允许鼠标滚轮步进
import type { InputNumberStepInfo, ValueType } from '@apollo-design/ui';
import { InputNumber } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<number | null>(1);
const lastEmitter = ref('');

function onStep(_value: ValueType, info: InputNumberStepInfo): void {
  lastEmitter.value = info.emitter;
}
</script>

<template>
  <div
    style="display: flex; flex-direction: column; gap: 12px; width: 300px; font-family: sans-serif"
  >
    <InputNumber
      v-model:value="value"
      change-on-wheel
      :min="0"
      :max="100"
      style="width: 140px"
      @step="onStep"
    />
    <div style="font-size: 12px; color: #999">
      当前值：{{ value ?? '空' }}；最近一次步进来源：{{ lastEmitter || '-' }}
    </div>
    <div style="font-size: 12px; color: #999">先聚焦输入框，再滚动鼠标滚轮试试</div>
  </div>
</template>
