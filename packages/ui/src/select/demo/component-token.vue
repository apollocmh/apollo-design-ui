<script setup lang="ts">
import { ConfigProvider, Select } from '@apollo-design/ui';
import { ref } from 'vue';

const largeOptions = ref(false);
const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
</script>

<template>
  <label style="display: block; margin-bottom: 12px">
    <input v-model="largeOptions" type="checkbox" /> Taller options
  </label>
  <ConfigProvider
    :theme="{
      components: { Select: { optionHeight: largeOptions ? 52 : 40, selectorBg: '#f6ffed', optionSelectedBg: '#d9f7be' } },
    }"
  >
    <Select :options="options" default-value="a1" aria-label="Themed choices" style="width: 200px" />
  </ConfigProvider>
</template>
