const n=`<script setup lang="ts">
// 对齐 antd demo/option-render.tsx
import { Select } from '@apollo-design/ui';

const options = [
  { value: 'gold', label: 'Gold' },
  { value: 'lime', label: 'Lime' },
];
<\/script>

<template>
  <Select :options="options" style="width: 200px">
    <template #optionRender="{ option }">
      <div style="display: flex; justify-content: space-between">
        <span>{{ option.label }}</span>
        <span style="color: #999">custom</span>
      </div>
    </template>
  </Select>
</template>
`;export{n as default};
