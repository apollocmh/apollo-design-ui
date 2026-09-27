<script setup lang="ts">
// 对齐 antd demo/non-case-sensitive.tsx

import type { DefaultOptionType } from '@apollo-design/ui';
import { AutoComplete } from '@apollo-design/ui';
import { ref } from 'vue';

const options = ref<DefaultOptionType[]>(
  ['.net', '.cpp', '.java', '.php'].map((ext) => ({
    value: ext,
  })),
);
</script>

<template>
  <AutoComplete
    style="width: 200px"
    :options="options"
    placeholder="input here"
    :filter-option="(input, option) => String(option?.value ?? '').toUpperCase().includes(input.toUpperCase())"
  />
</template>
