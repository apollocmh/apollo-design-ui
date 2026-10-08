const n=`<script setup lang="ts">
// 对齐 antd demo/automatic-tokenization.tsx
import { Select } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<string[]>([]);
const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
<\/script>

<template>
  <Select
    v-model:value="value"
    mode="tags"
    :options="options"
    :token-separators="[',']"
    style="width: 100%"
  />
</template>
`;export{n as default};
