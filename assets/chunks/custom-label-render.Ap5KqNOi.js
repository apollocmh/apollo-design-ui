const e=`<script setup lang="ts">
// 对齐 antd demo/custom-label-render.tsx（labelRender 作用域插槽）
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'gold', label: 'Gold' },
  { value: 'lime', label: 'Lime' },
];
<\/script>

<template>
  <Select :options="options" style="width: 200px">
    <template #labelRender="{ label, value }">
      <span style="font-weight: bold">{{ label ?? value }} (custom)</span>
    </template>
  </Select>
</template>
`;export{e as default};
