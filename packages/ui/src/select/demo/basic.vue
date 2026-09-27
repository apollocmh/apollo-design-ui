<script setup lang="ts">
// 对齐 antd demo/basic.tsx
import { Select } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string | undefined>('a1');

const options = [
  { value: 'a1', label: '杰克' },
  { value: 'b2', label: '露西' },
  { value: 'c3', label: '汤姆' },
  { value: 'd4', label: '杰瑞' },
];
</script>

<template>
  <Select v-model:value="value" :options="options" style="width: 120px" />
</template>
