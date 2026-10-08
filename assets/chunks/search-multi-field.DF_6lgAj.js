const n=`<script setup lang="ts">
// 对齐 antd demo/search-multi-field.tsx
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Jack', nick: 'J' },
  { value: 'b2', label: 'Lucy', nick: 'L' },
];
<\/script>

<template>
  <Select
    :options="options"
    :show-search="{ optionFilterProp: ['label', 'nick'] }"
    style="width: 200px"
  />
</template>
`;export{n as default};
