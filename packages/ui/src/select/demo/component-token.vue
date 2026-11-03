<script setup lang="ts">
import { Checkbox, ConfigProvider, Flex, Select } from '@apollo-design/ui';
import { ref } from 'vue';

const largeOptions = ref(false);
const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
</script>

<template>
  <Flex vertical gap="small" align="start">
    <Checkbox v-model:checked="largeOptions">Taller options</Checkbox>
  <ConfigProvider
    :theme="{
      components: { Select: { optionHeight: largeOptions ? 52 : 40, selectorBg: 'color-mix(in srgb, #52c41a 10%, var(--apollo-color-bg-container))', optionSelectedBg: 'color-mix(in srgb, #52c41a 24%, var(--apollo-color-bg-container))' } },
    }"
  >
    <Select :options="options" default-value="a1" aria-label="Themed choices" style="width: 200px" />
  </ConfigProvider>
  </Flex>
</template>
