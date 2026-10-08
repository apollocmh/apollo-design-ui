const n=`<script setup lang="ts">
// 对齐 antd demo/search-sort.tsx
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Not Identified' },
  { value: 'b2', label: 'Closed' },
  { value: 'c3', label: 'Communicated' },
];
const filterSort = (a: { label?: unknown }, b: { label?: unknown }): number =>
  String(a.label ?? '').localeCompare(String(b.label ?? ''));
<\/script>

<template>
  <Select
    :options="options"
    :show-search="{ optionFilterProp: 'label', filterSort }"
    style="width: 200px"
  />
</template>
`;export{n as default};
