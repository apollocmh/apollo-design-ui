<script setup lang="ts">
// 对齐 antd demo/hide-selected.tsx

import { type LabeledValue, Select } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const value = ref<LabeledValue[]>([]);
const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
  { value: 'c3', label: 'Tom' },
];
const availableOptions = computed(() => {
  const selected = new Set(value.value.map((item) => item.value));
  return options.filter((option) => !selected.has(option.value));
});
</script>

<template>
  <Select
    v-model:value="value"
    mode="multiple"
    label-in-value
    :options="availableOptions"
    :show-search="{ optionFilterProp: 'label' }"
    style="width: 100%"
  />
</template>
