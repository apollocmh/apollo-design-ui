<script setup lang="ts">
// 对齐 antd demo/status.tsx

import type { DefaultOptionType } from '@apollo-design/ui';
import { AutoComplete, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const options = ref<DefaultOptionType[]>([]);
const anotherOptions = ref<DefaultOptionType[]>([]);

const getPanelValue = (searchText: string) =>
  !searchText ? [] : [mockVal(searchText), mockVal(searchText, 2), mockVal(searchText, 3)];
const mockVal = (str: string, repeat = 1) => ({ value: str.repeat(repeat) });
</script>

<template>
  <Space vertical style="width: 100%">
    <AutoComplete
      :options="options"
      :show-search="{ onSearch: (t: string) => (options = getPanelValue(t)) }"
      status="error"
      style="width: 200px"
    />
    <AutoComplete
      :options="anotherOptions"
      :show-search="{ onSearch: (t: string) => (anotherOptions = getPanelValue(t)) }"
      status="warning"
      style="width: 200px"
    />
  </Space>
</template>
