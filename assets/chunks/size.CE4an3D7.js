const e=`<script setup lang="ts">
// 对齐 antd demo/size.tsx
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: '杰克' },
  { value: 'b2', label: '露西' },
];
<\/script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <Select :options="options" size="small" style="width: 120px" placeholder="small" />
    <Select :options="options" style="width: 120px" placeholder="middle" />
    <Select :options="options" size="large" style="width: 120px" placeholder="large" />
  </div>
</template>
`;export{e as default};
