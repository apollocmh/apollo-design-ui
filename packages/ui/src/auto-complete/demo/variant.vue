<script setup lang="ts">
// 对齐 antd demo/variant.tsx

import type { DefaultOptionType } from '@apollo-design/ui';
import { AutoComplete, Flex } from '@apollo-design/ui';
import { ref } from 'vue';

const options = ref<DefaultOptionType[]>([]);
const getPanelValue = (searchText: string) =>
  !searchText ? [] : [mockVal(searchText), mockVal(searchText, 2), mockVal(searchText, 3)];
const mockVal = (str: string, repeat = 1) => ({ value: str.repeat(repeat) });
const onSearch = (text: string) => {
  options.value = getPanelValue(text);
};
</script>

<template>
  <Flex vertical gap="12px">
    <AutoComplete :options="options" style="width: 200px" placeholder="Outlined" :show-search="{ onSearch }" />
    <AutoComplete :options="options" style="width: 200px" placeholder="Filled" variant="filled" :show-search="{ onSearch }" />
    <AutoComplete :options="options" style="width: 200px" placeholder="Borderless" variant="borderless" :show-search="{ onSearch }" />
    <AutoComplete :options="options" style="width: 200px" placeholder="Underlined" variant="underlined" :on-search="onSearch" />
  </Flex>
</template>
