const n=`<script setup lang="ts">
// 对齐 antd 的 demo/formatter.tsx

import { InputNumber } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<number | null>(1000);

const formatter = (v: number | string): string => \`$ \${v}\`.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
const parser = (v: string): string => v.replace(/\\$\\s?|(,*)/g, '');
<\/script>

<template>
  <div style="font-family: sans-serif">
    <InputNumber
      v-model:value="value"
      :formatter="formatter"
      :parser="parser"
      style="width: 200px"
    />
  </div>
</template>
`;export{n as default};
