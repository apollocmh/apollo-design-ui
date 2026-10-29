<script setup lang="ts">
// Input ref：focus / blur / select
import type { InputRef } from '@apollo-design/ui';
import { Button, Input, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const inputRef = ref<InputRef | null>(null);
const status = ref('尚未操作');

function focusStart(): void {
  inputRef.value?.focus({ cursor: 'start' });
  status.value = '已聚焦，光标在开头';
}

function selectAll(): void {
  inputRef.value?.select();
  status.value = '已全选输入内容';
}

function blurInput(): void {
  inputRef.value?.blur();
  status.value = '已失焦';
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; width: 320px; font-family: sans-serif">
    <Input ref="inputRef" aria-label="可聚焦输入框" default-value="Apollo Design" />
    <Space wrap>
      <Button @click="focusStart">聚焦到开头</Button>
      <Button @click="selectAll">全选</Button>
      <Button @click="blurInput">失焦</Button>
    </Space>
    <div style="font-size: 12px; color: var(--apollo-color-text-secondary)">状态：{{ status }}</div>
  </div>
</template>
