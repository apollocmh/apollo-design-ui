const e=`<script setup lang="ts">
// 对齐 antd demo/filled-debug.tsx
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
<\/script>

<template>
  <Select :options="options" variant="filled" style="width: 200px" />
</template>
`;export{e as default};
