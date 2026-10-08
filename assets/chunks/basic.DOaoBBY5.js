const e=`<script setup lang="ts">
// 对齐 antd demo/basic.tsx

import type { DefaultOptionType, SelectValue } from '@apollo-design/ui';
import { AutoComplete } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
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
<\/script>

<template>
  <div>
    <AutoComplete
      :options="options"
      style="width: 200px"
      :show-search="{ onSearch: (t: string) => (options = getPanelValue(t)) }"
      placeholder="input here"
      @select="onSelect"
    />
    <br />
    <br />
    <AutoComplete
      v-model:value="value"
      :options="anotherOptions"
      style="width: 200px"
      :show-search="{ onSearch: (t: string) => (anotherOptions = getPanelValue(t)) }"
      placeholder="control mode"
      @select="onSelect"
      @change="onChange"
    />
  </div>
</template>
`;export{e as default};
