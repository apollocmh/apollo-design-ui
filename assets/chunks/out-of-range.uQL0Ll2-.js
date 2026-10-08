const n=`<script setup lang="ts">
// 对齐 antd 的 demo/out-of-range.tsx：受控超界标红不回弹

import { InputNumber } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<number | null>(99);
<\/script>

<template>
  <div style="font-family: sans-serif">
    <InputNumber v-model:value="value" :min="1" :max="10" style="width: 120px" />
  </div>
</template>
`;export{n as default};
