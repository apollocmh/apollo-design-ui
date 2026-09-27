<script setup lang="ts">
// 对齐 antd demo/multiple.tsx
import { Select } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string[]>(['a1', 'b2']);

const options = [
  { value: 'a1', label: '杰克' },
  { value: 'b2', label: '露西' },
  { value: 'c3', label: '汤姆' },
];
</script>

<template>
  <Select v-model:value="value" mode="multiple" :options="options" style="width: 100%" />
</template>
