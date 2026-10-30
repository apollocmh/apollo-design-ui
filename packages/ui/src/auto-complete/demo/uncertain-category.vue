<script setup lang="ts">
// 对齐 antd demo/uncertain-category.tsx

import type { DefaultOptionType } from '@apollo-design/ui';
import { AutoComplete } from '@apollo-design/ui';
import { ref } from 'vue';

const options = ref<DefaultOptionType[]>([]);
const handleSearch = (value: string) => {
  setOptions(
    !value ? [] : [value, value + value, value + value + value].map((v) => ({ value: v })),
  );
};
const setOptions = (o: DefaultOptionType[]) => {
  options.value = o;
};
</script>

<template>
  <AutoComplete aria-label="自动补全输入框"
    style="width: 200px"
    @search="handleSearch"
    placeholder="input here"
    :options="options"
  />
</template>
