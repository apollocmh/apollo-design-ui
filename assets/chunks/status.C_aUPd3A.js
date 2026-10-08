const t=`<script setup lang="ts">
// 对齐 antd demo/status.tsx
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'a1', label: '杰克' },
  { value: 'b2', label: '露西' },
];
<\/script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <Select :options="options" status="error" style="width: 120px" placeholder="error" />
    <Select :options="options" status="warning" style="width: 120px" placeholder="warning" />
  </div>
</template>
`;export{t as default};
