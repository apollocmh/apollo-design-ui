const t=`<script setup lang="ts">
// 对齐 antd demo/option-label-center.tsx
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
<\/script>

<template>
  <Select :options="options" style="width: 200px">
    <template #optionRender="{ option }">
      <div style="text-align: center">{{ option.label }}</div>
    </template>
  </Select>
</template>
`;export{t as default};
