<script setup lang="ts">
// 对齐 antd demo/label-in-value.tsx
import { Select, type SelectValue } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<SelectValue>({
  value: 'a1',
  label: 'Jack',
});

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
</script>

<template>
  <div>
    <Select v-model:value="value" label-in-value :options="options" style="width: 200px" />
    <p>{{ value }}</p>
  </div>
</template>
