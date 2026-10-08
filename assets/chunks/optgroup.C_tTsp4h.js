const n=`<script setup lang="ts">
// 对齐 antd demo/optgroup.tsx（options 分组形态）
import { Select } from '@apollo-design/ui';

const options = [
  {
    label: 'Manager',
    options: [
      { value: 'jack', label: 'Jack' },
      { value: 'lucy', label: 'Lucy' },
    ],
  },
  { label: 'Engineer', options: [{ value: 'tom', label: 'Tom' }] },
];
<\/script>

<template>
  <Select :options="options" style="width: 120px" />
</template>
`;export{n as default};
