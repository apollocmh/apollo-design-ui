<script setup lang="ts">
import { Select } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string>();
const searchValue = ref('');
const open = ref(false);
const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
];
</script>

<template>
  <Select
    v-model:value="value"
    v-model:search-value="searchValue"
    v-model:open="open"
    :show-search="{ optionFilterProp: 'label' }"
    :options="options"
    aria-label="Choose a fruit"
    style="width: 240px"
  >
    <template #suffixIcon="{ open: expanded, focused }">{{ expanded ? '↑' : focused ? '•' : '↓' }}</template>
    <template #searchIcon>⌕</template>
  </Select>
  <p>Value: {{ value ?? '—' }} · Search: {{ searchValue || '—' }} · Open: {{ open }}</p>
</template>
