const t=`<script setup lang="ts">
// 对齐 antd demo/options.tsx（ASelectOption 子组件形态）
import { AutoComplete } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
const options = ref(['Burns Bay Road', 'Downing Street', 'Wall Street']);
<\/script>

<template>
  <AutoComplete v-model:value="value" style="width: 200px" :options="options.map((o) => ({ value: o }))" />
</template>
`;export{t as default};
