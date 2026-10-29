<script setup lang="ts">
// 对齐 antd 的 demo/search.tsx
import { InputSearch } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
const lastSearch = ref('');

function onSearch(next: string): void {
  lastSearch.value = next;
}
</script>

<template>
  <div style="width: 360px; display: flex; flex-direction: column; gap: 12px">
    <InputSearch
      v-model:value="value"
      allow-clear
      placeholder="input search text"
      :on-search="onSearch"
    />
    <InputSearch enter-button placeholder="input search text" :on-search="onSearch" />
    <InputSearch enter-button="Search" placeholder="input search text" :on-search="onSearch" />
    <div style="font-size: 12px; color: var(--apollo-color-text-secondary)">last search: {{ lastSearch || '-' }}</div>
  </div>
</template>
