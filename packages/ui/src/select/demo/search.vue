<script setup lang="ts">
// 对齐 antd demo/search.tsx（⚠️ optionFilterProp 默认按 value，此处显式指定 label）
import { Select } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string | undefined>();
const search = ref('');

const options = [
  { value: 'a1', label: 'Not Identified' },
  { value: 'b2', label: 'Closed' },
  { value: 'c3', label: 'Communicated' },
];
const onSearch = (v: string): void => {
  search.value = v;
};
</script>

<template>
  <div>
    <Select
      v-model:value="value"
      :options="options"
        :show-search="{ optionFilterProp: 'label' }"
      style="width: 200px"
      @search="onSearch"
    />
    <p>search: {{ search }}</p>
  </div>
</template>
