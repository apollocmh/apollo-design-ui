<script setup lang="ts">
// 对齐 antd demo/debug.tsx
import { Select } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string | undefined>();
const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
</script>

<template>
  <Select v-model:value="value" :options="options" allow-clear show-search style="width: 200px" />
</template>
