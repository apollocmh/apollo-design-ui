<script setup lang="ts">
// 对齐 antd demo/custom-tokenization.tsx（函数形态 tokenSeparators）
import { Select } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string[]>([]);
const options = [{ value: 'a1', label: 'Jack' }];
const tokenize = (input: string): string[] =>
  input
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean);
</script>

<template>
  <Select
    v-model:value="value"
    mode="tags"
    :options="options"
    :token-separators="tokenize"
    style="width: 100%"
  />
</template>
