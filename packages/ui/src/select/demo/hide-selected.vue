<script setup lang="ts">
// 对齐 antd demo/hide-selected.tsx

import type { DefaultOptionType } from '@apollo-design/ui';
import { Select } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string[]>([]);
const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
  { value: 'c3', label: 'Tom' },
];
</script>

<template>
  <Select
    v-model:value="value"
    mode="multiple"
    :options="options"
    :show-search="{
      filterOption: (i: string, o?: DefaultOptionType) => !value.includes(String(o?.value)),
    }"
    style="width: 100%"
  />
</template>
