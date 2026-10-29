<script setup lang="ts">
// Input.Search 的 loading 态：搜索期间按钮转圈并拦截重复搜索
import { InputSearch } from '@apollo-design/ui';
import { onBeforeUnmount, ref } from 'vue';

const value = ref('');
const loading = ref(false);
const result = ref('');

let timer: number | undefined;
let seq = 0;

function onSearch(next: string, _event?: Event, info?: { source?: 'clear' | 'input' }): void {
  const current = ++seq;
  window.clearTimeout(timer);

  if (info?.source === 'clear') {
    loading.value = false;
    result.value = '已清空搜索内容';
    return;
  }

  const keyword = next.trim();
  if (!keyword) {
    loading.value = false;
    result.value = '请输入关键词';
    return;
  }

  loading.value = true;
  result.value = '';
  timer = window.setTimeout(() => {
    if (current !== seq) return;
    loading.value = false;
    result.value = `找到 3 条与「${keyword}」相关的结果`;
  }, 1200);
}

onBeforeUnmount(() => {
  seq += 1;
  window.clearTimeout(timer);
});
</script>

<template>
  <div
    style="display: flex; flex-direction: column; gap: 12px; width: 380px; font-family: sans-serif"
  >
    <InputSearch
      v-model:value="value"
      enter-button="搜索"
      :loading="loading"
      placeholder="输入关键词后搜索"
      @search="onSearch"
    />
    <div style="font-size: 12px; color: var(--apollo-color-text-secondary)">
      {{ loading ? '搜索中…' : result || '等待搜索' }}
    </div>
  </div>
</template>
