const t=`<script setup lang="ts">
// 对齐 antd demo/search-filter-option.tsx

import type { DefaultOptionType } from '@apollo-design/ui';
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Not Identified' },
  { value: 'b2', label: 'Closed' },
  { value: 'c3', label: 'Communicated' },
];
const filterOption = (input: string, option?: DefaultOptionType): boolean =>
  String(option?.label ?? '')
    .toLowerCase()
    .includes(input.toLowerCase());
<\/script>

<template>
  <Select :options="options" show-search :filter-option="filterOption" style="width: 200px" />
</template>
`;export{t as default};
