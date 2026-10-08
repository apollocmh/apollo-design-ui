const n=`<script setup lang="ts">
// 对齐 antd 的 demo/disabled.tsx

import { InputNumber } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<number | null>(3);
<\/script>

<template>
  <div style="font-family: sans-serif">
    <InputNumber v-model:value="value" :min="1" :max="10" disabled style="width: 120px" />
  </div>
</template>
`;export{n as default};
