<script setup lang="ts">
// 对齐 antd demo/AutoComplete-and-Select.tsx（AutoComplete 与 Select 组合）

import type { DefaultOptionType } from '@apollo-design/ui';
import { AutoComplete, Flex, Select } from '@apollo-design/ui';
import { ref } from 'vue';

const options = ref<DefaultOptionType[]>([]);
const handleSearch = (value: string) => {
  options.value = !value
    ? []
    : [{ value }, { value: value + value }, { value: value + value + value }];
};
</script>

<template>
  <Flex vertical gap="medium">
    <AutoComplete
      style="width: 200px"
      :show-search="{ onSearch: handleSearch }"
      placeholder="try to type `b`"
      :options="options"
    />
    <Select style="width: 200px" placeholder="Select" :options="options" />
  </Flex>
</template>
