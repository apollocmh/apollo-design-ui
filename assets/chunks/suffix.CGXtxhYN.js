const t=`<script setup lang="ts">
// 对齐 antd demo/suffix.tsx
import { MoneyCollectOutlined } from '@apollo-design/icons';
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
<\/script>

<template>
  <Select :options="options" style="width: 200px">
    <template #suffixIcon><MoneyCollectOutlined /></template>
  </Select>
</template>
`;export{t as default};
