const n=`<script setup lang="ts">
// 对齐 antd demo/prefix.tsx
import { Mentions } from '@apollo-design/ui';
import { ref } from 'vue';

const MOCK_DATA: Record<string, string[]> = {
  '@': ['afc163', 'zombiej', 'yesmeck'],
  '#': ['1.0', '2.0', '3.0'],
};

const prefix = ref<'@' | '#'>('@');

const onSearch = (_: string, newPrefix: string) => {
  prefix.value = newPrefix as '@' | '#';
};
<\/script>

<template>
  <Mentions
    style="width: 100%"
    placeholder="input @ to mention people, # to mention tag"
    :prefix="['@', '#']"
    :on-search="onSearch"
    :options="(MOCK_DATA[prefix] ?? []).map((value) => ({ key: value, value, label: value }))"
  />
</template>
`;export{n as default};
