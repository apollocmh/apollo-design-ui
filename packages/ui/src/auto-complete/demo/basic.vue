<script setup lang="ts">
// 对齐 antd demo/basic.tsx

import type { DefaultOptionType, SelectValue } from '@apollo-design/ui';
import { AutoComplete } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
const searchValue = ref('');
const open = ref(false);
const options = ref<DefaultOptionType[]>([]);
const anotherOptions = ref<DefaultOptionType[]>([]);

const getPanelValue = (searchText: string) =>
  !searchText ? [] : [mockVal(searchText), mockVal(searchText, 2), mockVal(searchText, 3)];

const mockVal = (str: string, repeat = 1) => ({ value: str.repeat(repeat) });

const onSelect = (data: string | number) => {
  console.log('onSelect', data);
};
const onChange = (data: SelectValue) => {
  value.value = String(data);
};
</script>

<template>
  <div>
    <AutoComplete aria-label="自动补全输入框"
      :options="options"
      style="width: 200px"
      @search="text => (options = getPanelValue(text))"
      placeholder="input here"
      @select="onSelect"
    />
    <br />
    <br />
    <AutoComplete aria-label="自动补全输入框"
      v-model:value="value"
      v-model:search-value="searchValue"
      v-model:open="open"
      backfill
      :options="anotherOptions"
      style="width: 200px"
      @search="text => (anotherOptions = getPanelValue(text))"
      placeholder="control mode"
      @select="onSelect"
      @change="onChange"
    />
    <p>Value: {{ value || '—' }} · Search: {{ searchValue || '—' }} · Open: {{ open }}</p>
  </div>
</template>
