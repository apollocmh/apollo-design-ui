const n=`<script setup lang="ts">
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
<\/script>

<template>
  <AutoComplete
    style="width: 200px"
    :show-search="{ onSearch: handleSearch }"
    placeholder="input here"
    :options="options"
  />
</template>
`;export{n as default};
