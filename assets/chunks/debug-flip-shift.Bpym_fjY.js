const t=`<script setup lang="ts">
// 对齐 antd demo/debug-flip-shift.tsx
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: 'Jack' },
  { value: 'b2', label: 'Lucy' },
];
<\/script>

<template>
  <div style="height: 60px">
    <Select :options="options" placement="topLeft" style="width: 200px" />
  </div>
</template>
`;export{t as default};
