<script setup lang="ts">
// 实例方法：通过 ref 调用 focus / blur
import type { InputNumberRef } from '@apollo-design/ui';
import { Button, InputNumber, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const numberRef = ref<InputNumberRef | null>(null);
const status = ref('尚未操作');

function focusNumber(): void {
  numberRef.value?.focus();
  status.value = '已聚焦数字输入框';
}

function blurNumber(): void {
  numberRef.value?.blur();
  status.value = '已让数字输入框失焦';
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; width: 320px">
    <InputNumber
      ref="numberRef"
      aria-label="可聚焦的数字输入框"
      :default-value="6"
      :min="0"
      :max="20"
      style="width: 180px"
    />
    <Space wrap>
      <Button @click="focusNumber">聚焦</Button>
      <Button @click="blurNumber">失焦</Button>
    </Space>
    <p aria-live="polite" style="margin: 0; color: #999; font-size: 12px">状态：{{ status }}</p>
  </div>
</template>
