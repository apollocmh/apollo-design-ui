const n=`<script setup lang="ts">
// 对齐 antd 的 demo/basic.tsx

import { InputNumber } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<number | null>(3);
<\/script>

<template>
  <!-- 显式钉字体：继承字体差异是平台差异（CHECKLIST 四） -->
  <div style="font-family: sans-serif">
    <InputNumber v-model:value="value" :min="1" :max="10" style="width: 120px" />
  </div>
</template>
`;export{n as default};
